// Core implementation for timetable-solver in server/src/modules/engine/core/solver.
import type {
  EngineInput,
  EngineSubject,
  EngineFaculty,
  EngineRoom,
  EngineSection,
  Slot,
} from '../types';
import type {
  SolverOptions,
  SolverResult,
  SolveTask,
  ElectiveTaskBundle,
} from './types';
import { SeededRng } from './rng';
import { TaskBuilder } from './task-builder';
import { ValidationService } from '../validation.service';
import type { ScheduleVersionStats } from '@slotly/contracts';

interface CandidatePlacement {
  day: number;
  period: number;
  roomId: string;
  facultyId: string;
  score: number;
}

/** Class implementing timetable solver. */
export class TimetableSolver {
  private readonly rng: SeededRng;
  private readonly validator: ValidationService;
  private readonly options: Required<SolverOptions>;
  private readonly startTime: number;

  private readonly facultyMap = new Map<string, EngineFaculty>();
  private readonly roomMap = new Map<string, EngineRoom>();
  private readonly subjectMap = new Map<string, EngineSubject>();
  private readonly sectionMap = new Map<string, EngineSection>();

  constructor(options: SolverOptions = {}) {
    this.rng = new SeededRng(options.seed ?? 42);
    this.validator = new ValidationService();
    this.startTime = Date.now();

    this.options = {
      seed: options.seed ?? 42,
      timeLimitMs: options.timeLimitMs ?? 8000,
      profile: options.profile ?? 'standard',
      maxBacktrackSteps: options.maxBacktrackSteps ?? 60,
      swapIterations: options.swapIterations ?? 300,
    };
  }

  /**
   * Solves timetable scheduling for all sections simultaneously.
   */
  solve(input: EngineInput): SolverResult {
    const solveStart = Date.now();

    // Cache entity maps
    input.faculty.forEach((f) => this.facultyMap.set(f.id, f));
    input.rooms.forEach((r) => this.roomMap.set(r.id, r));
    input.subjects.forEach((s) => this.subjectMap.set(s.id, s));
    input.sections.forEach((sec) => this.sectionMap.set(sec.id, sec));

    const daysCount = input.settings.days.length || 5;

    // Identify breaks lookup: set of "day:period" or "*:period"
    const breakSet = new Set<string>();
    for (const b of input.settings.breaks || []) {
      if (b.day !== undefined) {
        breakSet.add(`${b.day}:${b.period}`);
      } else {
        breakSet.add(`*:${b.period}`);
      }
    }

    // Identify holidays
    const holidayDays = new Set<number>();
    const holidayList = (input.calendar?.holidays || []) as Array<{
      day?: number;
    }>;
    for (const h of holidayList) {
      if (typeof h.day === 'number') {
        holidayDays.add(h.day);
      }
    }

    // Helper to get total periods for a given day
    const getPeriodsForDay = (day: number): number => {
      const dayName = input.settings.days[day];
      if (dayName && input.settings.perDayOverrides?.[dayName]) {
        return (
          input.settings.perDayOverrides[dayName]?.periodsCount ||
          input.settings.periodsPerDay
        );
      }
      return input.settings.periodsPerDay || 7;
    };

    // Initialize slots with locked slots
    const slots: Slot[] = [];
    const lockedSlotIds = new Set<string>();

    for (const locked of input.lockedSlots || []) {
      slots.push({ ...locked });
      lockedSlotIds.add(locked.id);
    }

    // Build tasks with MRV/Degree hardness ordering
    const { tasks: standaloneTasks, electiveBundles } =
      TaskBuilder.buildTasks(input);

    let backtrackCount = 0;
    const unplacedTasks: SolveTask[] = [];

    // -------------------------------------------------------------------------
    // Phase 1A: Schedule Elective Bundles (Simultaneous placement across subjects)
    // -------------------------------------------------------------------------
    for (const bundle of electiveBundles) {
      if (this.isTimeExpired()) break;

      const placed = this.placeElectiveBundle(
        bundle,
        slots,
        input,
        daysCount,
        getPeriodsForDay,
        breakSet,
        holidayDays,
      );

      if (!placed) {
        unplacedTasks.push(...bundle.tasks);
      }
    }

    // -------------------------------------------------------------------------
    // Phase 1B: Schedule Standalone Tasks across ALL sections together
    // -------------------------------------------------------------------------
    const taskQueue = [...standaloneTasks];

    while (taskQueue.length > 0) {
      if (this.isTimeExpired()) {
        unplacedTasks.push(...taskQueue);
        break;
      }

      const task = taskQueue.shift()!;
      const candidate = this.findBestCandidate(
        task,
        slots,
        input,
        daysCount,
        getPeriodsForDay,
        breakSet,
        holidayDays,
      );

      if (candidate) {
        this.assignTask(task, candidate, slots);
      } else if (backtrackCount < (this.options.maxBacktrackSteps ?? 50)) {
        backtrackCount++;
        const evicted = this.tryBacktrack(
          task,
          slots,
          lockedSlotIds,
          input,
          daysCount,
          getPeriodsForDay,
          breakSet,
          holidayDays,
        );
        if (evicted) {
          taskQueue.unshift(...evicted);
        } else {
          unplacedTasks.push(task);
        }
      } else {
        unplacedTasks.push(task);
      }
    }

    // -------------------------------------------------------------------------
    // Phase 2: Swap-Based Soft Score Improvement (Local Search)
    // -------------------------------------------------------------------------
    this.runSwapImprovementPass(
      slots,
      lockedSlotIds,
      input,
      daysCount,
      getPeriodsForDay,
      breakSet,
      holidayDays,
    );

    // -------------------------------------------------------------------------
    // Phase 3: Final Validation and Statistics Calculation
    // -------------------------------------------------------------------------
    const validationReport = this.validator.validate(input, slots);
    const stats = this.calculateStats(
      slots,
      input,
      daysCount,
      getPeriodsForDay,
    );

    return {
      slots,
      score: validationReport.score,
      violations: validationReport.violations,
      stats,
      durationMs: Date.now() - solveStart,
      isFeasible:
        validationReport.hardViolationsCount === 0 &&
        unplacedTasks.length === 0,
      unplacedTasksCount: unplacedTasks.length,
    };
  }

  /**
   * Checks if allotted time budget has expired.
   */
  private isTimeExpired(): boolean {
    return Date.now() - this.startTime >= (this.options.timeLimitMs ?? 10000);
  }

  /**
   * Finds the highest-scoring conflict-free candidate placement for a task.
   */
  private findBestCandidate(
    task: SolveTask,
    slots: Slot[],
    input: EngineInput,
    daysCount: number,
    getPeriodsForDay: (day: number) => number,
    breakSet: Set<string>,
    holidayDays: Set<number>,
  ): CandidatePlacement | null {
    const candidates: CandidatePlacement[] = [];

    // Filter candidate rooms
    const reqType =
      task.requirements?.roomType || (task.type === 'lab' ? 'lab' : 'lecture');
    const minCap =
      task.requirements?.minCapacity ||
      this.sectionMap.get(task.sectionId)?.strength ||
      30;

    const candidateRooms = input.rooms.filter((r) => {
      if (reqType && r.type !== reqType) return false;
      if (r.capacity < minCap) return false;
      if (
        task.requirements?.equipment &&
        task.requirements.equipment.length > 0
      ) {
        const hasAll = task.requirements.equipment.every((eq) =>
          r.equipment?.includes(eq),
        );
        if (!hasAll) return false;
      }
      return true;
    });

    const candidateFacultyIds =
      task.facultyIds.length > 0
        ? task.facultyIds
        : input.faculty.map((f) => f.id);

    for (let day = 0; day < daysCount; day++) {
      if (holidayDays.has(day)) continue;

      const totalPeriods = getPeriodsForDay(day);
      if (task.span > totalPeriods) continue;

      for (let period = 0; period <= totalPeriods - task.span; period++) {
        // Break check
        if (this.hasBreakOverlap(day, period, task.span, breakSet)) {
          continue;
        }

        // Section / Batch check
        if (
          this.isSectionOrBatchBusy(
            task.sectionId,
            task.batchId,
            day,
            period,
            task.span,
            slots,
          )
        ) {
          continue;
        }

        for (const facultyId of candidateFacultyIds) {
          if (
            !this.isFacultyAvailable(facultyId, day, period, task.span, slots)
          ) {
            continue;
          }

          for (const room of candidateRooms) {
            if (!this.isRoomAvailable(room.id, day, period, task.span, slots)) {
              continue;
            }

            const score = this.evaluatePlacementScore(
              task,
              day,
              period,
              room.id,
              facultyId,
              slots,
            );

            candidates.push({
              day,
              period,
              roomId: room.id,
              facultyId,
              score,
            });
          }
        }
      }
    }

    if (candidates.length === 0) return null;

    // Sort by placement score descending and pick best (with random tie-breaking)
    candidates.sort((a, b) => b.score - a.score);
    const topScore = candidates[0]!.score;
    const topTies = candidates.filter(
      (c) => Math.abs(c.score - topScore) < 0.1,
    );

    return this.rng.pick(topTies) || candidates[0]!;
  }

  /**
   * Places an elective bundle so all member tasks run simultaneously at the same day/period.
   */
  private placeElectiveBundle(
    bundle: ElectiveTaskBundle,
    slots: Slot[],
    input: EngineInput,
    daysCount: number,
    getPeriodsForDay: (day: number) => number,
    breakSet: Set<string>,
    holidayDays: Set<number>,
  ): boolean {
    const span = Math.max(...bundle.tasks.map((t) => t.span));

    for (let day = 0; day < daysCount; day++) {
      if (holidayDays.has(day)) continue;

      const totalPeriods = getPeriodsForDay(day);
      if (span > totalPeriods) continue;

      for (let period = 0; period <= totalPeriods - span; period++) {
        if (this.hasBreakOverlap(day, period, span, breakSet)) continue;

        // Try to match a distinct room and faculty for each task in bundle
        const assignments: Array<{
          task: SolveTask;
          roomId: string;
          facultyId: string;
        }> = [];

        const usedRooms = new Set<string>();
        const usedFaculty = new Set<string>();
        let feasible = true;

        for (const task of bundle.tasks) {
          // Section/Batch availability check
          if (
            this.isSectionOrBatchBusy(
              task.sectionId,
              task.batchId,
              day,
              period,
              span,
              slots,
              bundle.electiveGroupId,
            )
          ) {
            feasible = false;
            break;
          }

          // Find faculty
          const candFaculty = task.facultyIds.find(
            (fId) =>
              !usedFaculty.has(fId) &&
              this.isFacultyAvailable(fId, day, period, span, slots),
          );
          if (!candFaculty) {
            feasible = false;
            break;
          }

          // Find room
          const reqType =
            task.requirements?.roomType ||
            (task.type === 'lab' ? 'lab' : 'lecture');
          let minCap = task.requirements?.minCapacity;
          if (!minCap) {
            const groupSize = Math.max(1, bundle.tasks.length);
            const totalStrength =
              this.sectionMap.get(task.sectionId)?.strength || 30;
            minCap = Math.ceil(totalStrength / groupSize);
          }

          const candRoom = input.rooms.find(
            (r) =>
              !usedRooms.has(r.id) &&
              (reqType ? r.type === reqType : true) &&
              r.capacity >= minCap &&
              this.isRoomAvailable(r.id, day, period, span, slots),
          );
          if (!candRoom) {
            feasible = false;
            break;
          }

          usedFaculty.add(candFaculty);
          usedRooms.add(candRoom.id);
          assignments.push({
            task,
            roomId: candRoom.id,
            facultyId: candFaculty,
          });
        }

        if (feasible && assignments.length === bundle.tasks.length) {
          for (const asg of assignments) {
            this.assignTask(
              asg.task,
              {
                day,
                period,
                roomId: asg.roomId,
                facultyId: asg.facultyId,
                score: 100,
              },
              slots,
            );
          }
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Backtracking step: evicts a conflicting non-locked slot to make room for current task.
   */
  private tryBacktrack(
    task: SolveTask,
    slots: Slot[],
    lockedSlotIds: Set<string>,
    input: EngineInput,
    daysCount: number,
    getPeriodsForDay: (day: number) => number,
    breakSet: Set<string>,
    holidayDays: Set<number>,
  ): SolveTask[] | null {
    // Search for a day and period where only ONE non-locked slot is in conflict
    for (let day = 0; day < daysCount; day++) {
      if (holidayDays.has(day)) continue;

      const totalPeriods = getPeriodsForDay(day);
      if (task.span > totalPeriods) continue;

      for (let period = 0; period <= totalPeriods - task.span; period++) {
        if (this.hasBreakOverlap(day, period, task.span, breakSet)) continue;

        const conflictingSlots = slots.filter((s) => {
          if (s.day !== day) return false;
          const overlap =
            s.period < period + task.span && s.period + (s.span || 1) > period;
          if (!overlap) return false;

          return (
            s.sectionId === task.sectionId ||
            (task.batchId && s.batchId === task.batchId) ||
            task.facultyIds.includes(s.facultyId || '')
          );
        });

        if (conflictingSlots.length === 1) {
          const victim = conflictingSlots[0]!;
          if (!lockedSlotIds.has(victim.id)) {
            // Evict victim slot
            const idx = slots.findIndex((s) => s.id === victim.id);
            if (idx !== -1) {
              slots.splice(idx, 1);

              // Assign current task in place
              const candidate = this.findBestCandidate(
                task,
                slots,
                input,
                daysCount,
                getPeriodsForDay,
                breakSet,
                holidayDays,
              );

              if (candidate && victim.subjectId) {
                this.assignTask(task, candidate, slots);
                // Re-create SolveTask for evicted victim
                const victimSub = this.subjectMap.get(victim.subjectId);
                const victimTask: SolveTask = {
                  taskId: `evicted:${victim.id}`,
                  subjectId: victim.subjectId,
                  sectionId: victim.sectionId,
                  batchId: victim.batchId,
                  type: victim.type,
                  span: victim.span || 1,
                  facultyIds: victim.facultyId ? [victim.facultyId] : [],
                  hardness: (victimSub?.weeklyHours || 3) * 10,
                };
                return [victimTask];
              } else {
                // Restore victim if current task still couldn't be placed
                slots.splice(idx, 0, victim);
              }
            }
          }
        }
      }
    }

    return null;
  }

  /**
   * Swap-based improvement pass: pairwise slot swaps within sections to optimize soft scores.
   */
  private runSwapImprovementPass(
    slots: Slot[],
    lockedSlotIds: Set<string>,
    _input: EngineInput,
    _daysCount: number,
    _getPeriodsForDay: (day: number) => number,
    breakSet: Set<string>,
    holidayDays: Set<number>,
  ): void {
    const mutableSlots = slots.filter((s) => !lockedSlotIds.has(s.id));
    if (mutableSlots.length < 2) return;

    for (let iter = 0; iter < (this.options.swapIterations ?? 200); iter++) {
      if (this.isTimeExpired()) break;

      const idxA = this.rng.range(0, mutableSlots.length - 1);
      const idxB = this.rng.range(0, mutableSlots.length - 1);
      if (idxA === idxB) continue;

      const slotA = mutableSlots[idxA]!;
      const slotB = mutableSlots[idxB]!;

      // Prefer swapping slots within the same section or with identical span
      if (slotA.span !== slotB.span) continue;

      const span = slotA.span || 1;

      // Check if slotA fits at slotB's position
      if (
        holidayDays.has(slotB.day) ||
        this.hasBreakOverlap(slotB.day, slotB.period, span, breakSet)
      ) {
        continue;
      }
      if (
        holidayDays.has(slotA.day) ||
        this.hasBreakOverlap(slotA.day, slotA.period, span, breakSet)
      ) {
        continue;
      }

      // Check faculty & room availability for the swap
      const otherSlots = slots.filter(
        (s) => s.id !== slotA.id && s.id !== slotB.id,
      );

      const aCanGoToB =
        !this.isSectionOrBatchBusy(
          slotA.sectionId,
          slotA.batchId,
          slotB.day,
          slotB.period,
          span,
          otherSlots,
        ) &&
        (!slotA.facultyId ||
          this.isFacultyAvailable(
            slotA.facultyId,
            slotB.day,
            slotB.period,
            span,
            otherSlots,
          )) &&
        (!slotA.roomId ||
          this.isRoomAvailable(
            slotA.roomId,
            slotB.day,
            slotB.period,
            span,
            otherSlots,
          ));

      const bCanGoToA =
        !this.isSectionOrBatchBusy(
          slotB.sectionId,
          slotB.batchId,
          slotA.day,
          slotA.period,
          span,
          otherSlots,
        ) &&
        (!slotB.facultyId ||
          this.isFacultyAvailable(
            slotB.facultyId,
            slotA.day,
            slotA.period,
            span,
            otherSlots,
          )) &&
        (!slotB.roomId ||
          this.isRoomAvailable(
            slotB.roomId,
            slotA.day,
            slotA.period,
            span,
            otherSlots,
          ));

      if (aCanGoToB && bCanGoToA) {
        // Swap coordinates
        const origDayA = slotA.day;
        const origPerA = slotA.period;

        slotA.day = slotB.day;
        slotA.period = slotB.period;

        slotB.day = origDayA;
        slotB.period = origPerA;
      }
    }
  }

  /**
   * Assigns a task to candidate coordinates.
   */
  private assignTask(
    task: SolveTask,
    candidate: CandidatePlacement,
    slots: Slot[],
  ): void {
    const slotId = `slot:${task.sectionId}:${candidate.day}:${candidate.period}:${this.rng.range(1000, 9999)}`;
    slots.push({
      id: slotId,
      sectionId: task.sectionId,
      batchId: task.batchId || undefined,
      day: candidate.day,
      period: candidate.period,
      type: task.type,
      subjectId: task.subjectId,
      facultyId: candidate.facultyId || undefined,
      roomId: candidate.roomId || undefined,
      span: task.span > 1 ? task.span : 1,
      isLocked: false,
    });
  }

  /**
   * Helper: checks if candidate slot overlaps with scheduled break period.
   */
  private hasBreakOverlap(
    day: number,
    period: number,
    span: number,
    breakSet: Set<string>,
  ): boolean {
    for (let p = period; p < period + span; p++) {
      if (breakSet.has(`${day}:${p}`) || breakSet.has(`*:${p}`)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper: checks if section or batch is occupied at day/period.
   */
  private isSectionOrBatchBusy(
    sectionId: string,
    batchId: string | undefined,
    day: number,
    period: number,
    span: number,
    slots: Slot[],
    electiveGroupId?: string,
  ): boolean {
    for (const slot of slots) {
      if (slot.day !== day) continue;
      const slotSpan = slot.span || 1;
      const overlaps =
        slot.period < period + span && slot.period + slotSpan > period;
      if (!overlaps) continue;

      if (slot.sectionId === sectionId) {
        if (electiveGroupId && slot.subjectId) {
          const slotSub = this.subjectMap.get(slot.subjectId);
          if (slotSub?.electiveGroupId === electiveGroupId) {
            continue;
          }
        }
        if (!batchId || !slot.batchId || batchId === slot.batchId) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Helper: checks if faculty is free and available at day/period.
   */
  private isFacultyAvailable(
    facultyId: string,
    day: number,
    period: number,
    span: number,
    slots: Slot[],
  ): boolean {
    const faculty = this.facultyMap.get(facultyId);
    if (!faculty) return true;

    // Availability matrix check
    if (faculty.availability && faculty.availability[day]) {
      for (let p = period; p < period + span; p++) {
        if (faculty.availability[day][p] === false) return false;
      }
    }

    // Unavailable slots check
    if (faculty.unavailableSlots && faculty.unavailableSlots.length > 0) {
      for (let p = period; p < period + span; p++) {
        if (
          faculty.unavailableSlots.some((u) => u.day === day && u.period === p)
        ) {
          return false;
        }
      }
    }

    // Double booking check
    for (const s of slots) {
      if (s.facultyId !== facultyId || s.day !== day) continue;
      const slotSpan = s.span || 1;
      if (s.period < period + span && s.period + slotSpan > period) {
        return false;
      }
    }

    // Max hours per day limit
    const dayHours = slots
      .filter((s) => s.facultyId === facultyId && s.day === day)
      .reduce((acc, s) => acc + (s.span || 1), 0);
    const maxPerDay = faculty.maxHoursPerDay ?? 6;
    if (dayHours + span > maxPerDay) {
      return false;
    }

    return true;
  }

  /**
   * Helper: checks if room is free at day/period.
   */
  private isRoomAvailable(
    roomId: string,
    day: number,
    period: number,
    span: number,
    slots: Slot[],
  ): boolean {
    const room = this.roomMap.get(roomId);
    if (room?.availability && room.availability[day]) {
      for (let p = period; p < period + span; p++) {
        if (room.availability[day][p] === false) return false;
      }
    }

    for (const s of slots) {
      if (s.roomId !== roomId || s.day !== day) continue;
      const slotSpan = s.span || 1;
      if (s.period < period + span && s.period + slotSpan > period) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluates soft preference placement score based on the chosen profile weights.
   */
  private evaluatePlacementScore(
    task: SolveTask,
    day: number,
    period: number,
    roomId: string,
    facultyId: string,
    slots: Slot[],
  ): number {
    let score = 50;
    const profile = this.options.profile;

    const faculty = this.facultyMap.get(facultyId);

    // 1. Faculty preferred periods
    if (faculty?.preferredPeriods && faculty.preferredPeriods.length > 0) {
      const isPreferred = faculty.preferredPeriods.some(
        (p) => p.day === day && p.period === period,
      );
      const weight = profile === 'preference-first' ? 25 : 10;
      score += isPreferred ? weight : -weight;
    }

    // 2. Spread subjects across days
    const subjectDays = slots
      .filter(
        (s) => s.sectionId === task.sectionId && s.subjectId === task.subjectId,
      )
      .map((s) => s.day);
    if (subjectDays.includes(day)) {
      score -= profile === 'workload-balanced' ? 20 : 10;
    } else {
      score += 15;
    }

    // 3. Limit consecutive same subject (for non-lab)
    if (task.type !== 'lab') {
      const adjacentSame = slots.some(
        (s) =>
          s.sectionId === task.sectionId &&
          s.subjectId === task.subjectId &&
          s.day === day &&
          (s.period === period - 1 || s.period === period + task.span),
      );
      if (adjacentSame) {
        score -= profile === 'workload-balanced' ? 18 : 10;
      }
    }

    // 4. Labs in afternoon preference
    if (task.type === 'lab') {
      const afternoonWeight = profile === 'preference-first' ? 30 : 15;
      if (period >= 3) {
        score += afternoonWeight;
      } else {
        score -= afternoonWeight;
      }
    }

    // 5. Minimize room changes for theory
    if (task.type === 'theory') {
      const sameRoomToday = slots.some(
        (s) =>
          s.sectionId === task.sectionId &&
          s.day === day &&
          s.roomId === roomId,
      );
      const roomWeight = profile === 'room-efficient' ? 25 : 10;
      if (sameRoomToday) {
        score += roomWeight;
      }
    }

    // 6. Balance faculty daily load
    const facultyDayHours = slots
      .filter((s) => s.facultyId === facultyId && s.day === day)
      .reduce((acc, s) => acc + (s.span || 1), 0);
    const balanceWeight = profile === 'workload-balanced' ? 6 : 3;
    score += (4 - facultyDayHours) * balanceWeight;

    // Small deterministic tie-breaker
    score += this.rng.next() * 0.5;

    return score;
  }

  /**
   * Computes schedule statistics.
   */
  private calculateStats(
    slots: Slot[],
    input: EngineInput,
    daysCount: number,
    getPeriodsForDay: (day: number) => number,
  ): ScheduleVersionStats {
    let totalPossiblePeriods = 0;
    for (let d = 0; d < daysCount; d++) {
      totalPossiblePeriods += getPeriodsForDay(d);
    }
    const totalSlots = (input.sections.length || 1) * totalPossiblePeriods;
    const occupiedSlots = slots.reduce((acc, s) => acc + (s.span || 1), 0);

    // Room utilization %
    const totalRoomCapacityHours =
      (input.rooms.length || 1) * totalPossiblePeriods;
    const roomHoursUsed = slots.filter((s) => s.roomId).length;
    const roomUtilizationPct = Math.min(
      100,
      Math.round((roomHoursUsed / (totalRoomCapacityHours || 1)) * 100),
    );

    // Faculty load balance score (100 - standard deviation penalty)
    const facultyHours = new Map<string, number[]>();
    for (const f of input.faculty) {
      facultyHours.set(f.id, new Array<number>(daysCount).fill(0));
    }
    for (const s of slots) {
      if (s.facultyId && facultyHours.has(s.facultyId)) {
        const arr = facultyHours.get(s.facultyId)!;
        const cur = arr[s.day];
        if (typeof cur === 'number') {
          arr[s.day] = cur + (s.span || 1);
        }
      }
    }

    let varianceSum = 0;
    for (const [, daily] of facultyHours.entries()) {
      const mean = daily.reduce((a, b) => a + b, 0) / (daily.length || 1);
      const variance =
        daily.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
        (daily.length || 1);
      varianceSum += Math.sqrt(variance);
    }
    const avgStdDev = varianceSum / (input.faculty.length || 1);
    const facultyLoadBalanceScore = Math.max(
      0,
      Math.min(100, Math.round(100 - avgStdDev * 15)),
    );

    // Afternoon lab %
    const labSlots = slots.filter((s) => s.type === 'lab');
    const afternoonLabs = labSlots.filter((s) => s.period >= 3);
    const afternoonLabPct =
      labSlots.length > 0
        ? Math.round((afternoonLabs.length / labSlots.length) * 100)
        : 100;

    return {
      totalSlots,
      occupiedSlots,
      roomUtilizationPct,
      facultyLoadBalanceScore,
      afternoonLabPct,
    };
  }
}
