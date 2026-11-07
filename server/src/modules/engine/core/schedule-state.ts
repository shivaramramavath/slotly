// Core implementation for schedule-state in server/src/modules/engine/core.
import type {
  EngineInput,
  Slot,
  Move,
  EngineFaculty,
  EngineRoom,
  EngineSubject,
  EngineSection,
  EngineBatch,
} from './types';

/** Class implementing schedule state. */
export class ScheduleState {
  readonly input: EngineInput;
  readonly slots: Slot[];

  // Fast index maps
  private readonly facultyIndex = new Map<string, Slot[]>();
  private readonly roomIndex = new Map<string, Slot[]>();
  private readonly sectionIndex = new Map<string, Slot[]>();
  private readonly batchIndex = new Map<string, Slot[]>();
  private readonly subjectIndex = new Map<string, Slot[]>();

  // Entity lookup maps
  private readonly facultyMap = new Map<string, EngineFaculty>();
  private readonly roomMap = new Map<string, EngineRoom>();
  private readonly subjectMap = new Map<string, EngineSubject>();
  private readonly sectionMap = new Map<string, EngineSection>();
  private readonly batchMap = new Map<string, EngineBatch>();

  constructor(input: EngineInput, slots: Slot[]) {
    this.input = input;
    this.slots = slots;

    // Index entities
    input.faculty.forEach((f) => this.facultyMap.set(f.id, f));
    input.rooms.forEach((r) => this.roomMap.set(r.id, r));
    input.subjects.forEach((s) => this.subjectMap.set(s.id, s));
    input.sections.forEach((sec) => this.sectionMap.set(sec.id, sec));
    input.batches.forEach((b) => this.batchMap.set(b.id, b));

    // Index slots
    for (const slot of slots) {
      if (slot.facultyId) {
        const key = `${slot.facultyId}:${slot.day}:${slot.period}`;
        const list = this.facultyIndex.get(key) || [];
        list.push(slot);
        this.facultyIndex.set(key, list);
      }

      if (slot.roomId) {
        const key = `${slot.roomId}:${slot.day}:${slot.period}`;
        const list = this.roomIndex.get(key) || [];
        list.push(slot);
        this.roomIndex.set(key, list);
      }

      const secKey = `${slot.sectionId}:${slot.day}:${slot.period}`;
      const secList = this.sectionIndex.get(secKey) || [];
      secList.push(slot);
      this.sectionIndex.set(secKey, secList);

      if (slot.batchId) {
        const batchKey = `${slot.batchId}:${slot.day}:${slot.period}`;
        const batchList = this.batchIndex.get(batchKey) || [];
        batchList.push(slot);
        this.batchIndex.set(batchKey, batchList);
      }

      if (slot.subjectId) {
        const subList = this.subjectIndex.get(slot.subjectId) || [];
        subList.push(slot);
        this.subjectIndex.set(slot.subjectId, subList);
      }
    }
  }

  getFacultySlotsAt(facultyId: string, day: number, period: number): Slot[] {
    return this.facultyIndex.get(`${facultyId}:${day}:${period}`) || [];
  }

  getRoomSlotsAt(roomId: string, day: number, period: number): Slot[] {
    return this.roomIndex.get(`${roomId}:${day}:${period}`) || [];
  }

  getSectionSlotsAt(sectionId: string, day: number, period: number): Slot[] {
    return this.sectionIndex.get(`${sectionId}:${day}:${period}`) || [];
  }

  getBatchSlotsAt(batchId: string, day: number, period: number): Slot[] {
    return this.batchIndex.get(`${batchId}:${day}:${period}`) || [];
  }

  getSlotsForFaculty(facultyId: string): Slot[] {
    return this.slots.filter((s) => s.facultyId === facultyId);
  }

  getSlotsForRoom(roomId: string): Slot[] {
    return this.slots.filter((s) => s.roomId === roomId);
  }

  getSlotsForSection(sectionId: string): Slot[] {
    return this.slots.filter((s) => s.sectionId === sectionId);
  }

  getSlotsForSubject(subjectId: string): Slot[] {
    return this.subjectIndex.get(subjectId) || [];
  }

  findFaculty(id: string): EngineFaculty | undefined {
    return this.facultyMap.get(id);
  }

  findRoom(id: string): EngineRoom | undefined {
    return this.roomMap.get(id);
  }

  findSubject(id: string): EngineSubject | undefined {
    return this.subjectMap.get(id);
  }

  findSection(id: string): EngineSection | undefined {
    return this.sectionMap.get(id);
  }

  findBatch(id: string): EngineBatch | undefined {
    return this.batchMap.get(id);
  }

  /**
   * Returns a clone of this state with a hypothetical move applied.
   */
  cloneWithMove(move: Move): ScheduleState {
    const updatedSlots = this.slots.map((s) => {
      if (s.id === move.slot.id) {
        return {
          ...s,
          day: move.target.day,
          period: move.target.period,
          roomId: move.target.roomId ?? s.roomId,
          facultyId: move.target.facultyId ?? s.facultyId,
        };
      }
      return s;
    });

    return new ScheduleState(this.input, updatedSlots);
  }
}
