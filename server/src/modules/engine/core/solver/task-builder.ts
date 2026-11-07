// Core implementation for task-builder in server/src/modules/engine/core/solver.
import type { EngineInput, EngineSection } from '../types';
import type { SolveTask, ElectiveTaskBundle } from './types';

/** Class implementing task builder. */
export class TaskBuilder {
  /**
   * Deconstructs engine input subjects into atomic scheduling tasks with MRV/degree hardness ratings.
   */
  static buildTasks(input: EngineInput): {
    tasks: SolveTask[];
    electiveBundles: ElectiveTaskBundle[];
  } {
    const rawTasks: SolveTask[] = [];
    const sectionMap = new Map<string, EngineSection>();
    input.sections.forEach((s) => sectionMap.set(s.id, s));

    const defaultSectionId = input.sections[0]?.id || 'sec_default';

    for (const subject of input.subjects) {
      const sectionId = subject.sectionId || defaultSectionId;
      const section = sectionMap.get(sectionId);
      const strength = section?.strength || 60;

      const span =
        subject.type === 'lab'
          ? Math.max(1, subject.consecutivePeriods || 2)
          : Math.max(1, subject.consecutivePeriods || 1);

      const weeklyHours = Math.max(1, subject.weeklyHours || 3);
      const totalBlocks = Math.ceil(weeklyHours / span);

      // Compute domain sizes for MRV heuristic
      const qualifiedFaculty =
        subject.facultyIds && subject.facultyIds.length > 0
          ? subject.facultyIds
          : input.faculty.map((f) => f.id);

      const reqType =
        subject.requirements?.roomType ||
        (subject.type === 'lab' ? 'lab' : 'lecture');
      const minCap = subject.requirements?.minCapacity || strength;

      const suitableRooms = input.rooms.filter((r) => {
        if (reqType && r.type !== reqType) return false;
        if (r.capacity < minCap) return false;
        return true;
      });

      // Calculate hardness rating (Higher score = Harder to schedule -> Schedule first)
      let hardness = 0;
      if (span > 1) hardness += 500; // Multi-hour lab blocks are hardest
      if (subject.electiveGroupId) hardness += 400; // Synchronized electives
      hardness += (10 - Math.min(10, qualifiedFaculty.length)) * 30; // Fewer faculty
      hardness += (10 - Math.min(10, suitableRooms.length)) * 25; // Fewer rooms
      hardness += weeklyHours * 10;

      for (let i = 0; i < totalBlocks; i++) {
        rawTasks.push({
          taskId: `task:${subject.id}:${i}`,
          subjectId: subject.id,
          sectionId,
          batchId: subject.batchId || undefined,
          type: subject.type,
          span,
          facultyIds: qualifiedFaculty,
          electiveGroupId: subject.electiveGroupId || undefined,
          requirements: subject.requirements || undefined,
          preferredDays: subject.preferredDays || undefined,
          hardness,
        });
      }
    }

    // Separate elective bundles if they must be simultaneous
    const electiveSubjectTasks = new Map<string, SolveTask[]>();
    const standaloneTasks: SolveTask[] = [];

    for (const task of rawTasks) {
      if (task.electiveGroupId) {
        const group = input.electiveGroups.find(
          (eg) => eg.id === task.electiveGroupId,
        );
        if (group && group.mustBeSimultaneous) {
          const list = electiveSubjectTasks.get(task.subjectId) || [];
          list.push(task);
          electiveSubjectTasks.set(task.subjectId, list);
          continue;
        }
      }
      standaloneTasks.push(task);
    }

    // Form bundles where bundle i contains block i from each subject in the simultaneous group
    const electiveBundles: ElectiveTaskBundle[] = [];
    for (const group of input.electiveGroups.filter(
      (g) => g.mustBeSimultaneous,
    )) {
      const subjectTaskLists = group.subjectIds
        .map((sId) => electiveSubjectTasks.get(sId) || [])
        .filter((l) => l.length > 0);

      const maxBlocks = Math.max(0, ...subjectTaskLists.map((l) => l.length));

      for (let b = 0; b < maxBlocks; b++) {
        const bundleTasks: SolveTask[] = [];
        for (const list of subjectTaskLists) {
          if (list[b]) {
            bundleTasks.push(list[b]!);
          }
        }
        if (bundleTasks.length > 0) {
          const avgHardness =
            bundleTasks.reduce((acc, t) => acc + t.hardness, 0) /
            bundleTasks.length;
          electiveBundles.push({
            bundleId: `bundle:${group.id}:${b}`,
            electiveGroupId: group.id,
            tasks: bundleTasks,
            hardness: avgHardness + 300,
          });
        }
      }
    }

    // Sort standalone tasks by hardness descending (MRV ordering)
    standaloneTasks.sort((a, b) => b.hardness - a.hardness);
    electiveBundles.sort((a, b) => b.hardness - a.hardness);

    return {
      tasks: standaloneTasks,
      electiveBundles,
    };
  }
}
