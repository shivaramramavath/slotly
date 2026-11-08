// Core implementation for project-state.factory in server/src/modules/projects/lifecycle.
import type { ProjectLifecycleStatus } from '@slotly/contracts';
import type { IProjectState } from './project-state.interface';

/** Class implementing draft state. */
export class DraftState implements IProjectState {
  readonly status: ProjectLifecycleStatus = 'draft';

  canEdit(): boolean {
    return true;
  }
  canBuild(): boolean {
    return true;
  }
  canRequestApproval(): boolean {
    return false;
  }
  canPublish(): boolean {
    return false;
  }
  canArchive(): boolean {
    return true;
  }
  canRestore(): boolean {
    return false;
  }
  transitionTo(target: ProjectLifecycleStatus): boolean {
    return target === 'building' || target === 'ready' || target === 'archived';
  }
}

/** Class implementing building state. */
export class BuildingState implements IProjectState {
  readonly status: ProjectLifecycleStatus = 'building';

  canEdit(): boolean {
    return false;
  }
  canBuild(): boolean {
    return false;
  }
  canRequestApproval(): boolean {
    return false;
  }
  canPublish(): boolean {
    return false;
  }
  canArchive(): boolean {
    return false;
  }
  canRestore(): boolean {
    return false;
  }
  transitionTo(target: ProjectLifecycleStatus): boolean {
    return target === 'ready' || target === 'draft';
  }
}

/** Class implementing ready state. */
export class ReadyState implements IProjectState {
  readonly status: ProjectLifecycleStatus = 'ready';

  canEdit(): boolean {
    return true;
  }
  canBuild(): boolean {
    return true;
  }
  canRequestApproval(): boolean {
    return true;
  }
  canPublish(): boolean {
    return true;
  }
  canArchive(): boolean {
    return true;
  }
  canRestore(): boolean {
    return false;
  }
  transitionTo(target: ProjectLifecycleStatus): boolean {
    return (
      target === 'building' ||
      target === 'pending_approval' ||
      target === 'published' ||
      target === 'archived' ||
      target === 'draft'
    );
  }
}

/** Class implementing pending approval state. */
export class PendingApprovalState implements IProjectState {
  readonly status: ProjectLifecycleStatus = 'pending_approval';

  canEdit(): boolean {
    return false;
  }
  canBuild(): boolean {
    return false;
  }
  canRequestApproval(): boolean {
    return false;
  }
  canPublish(): boolean {
    return true;
  }
  canArchive(): boolean {
    return true;
  }
  canRestore(): boolean {
    return false;
  }
  transitionTo(target: ProjectLifecycleStatus): boolean {
    return (
      target === 'published' ||
      target === 'ready' ||
      target === 'draft' ||
      target === 'archived'
    );
  }
}

/** Class implementing published state. */
export class PublishedState implements IProjectState {
  readonly status: ProjectLifecycleStatus = 'published';

  canEdit(): boolean {
    return false; // Published timetables are immutable
  }
  canBuild(): boolean {
    return false;
  }
  canRequestApproval(): boolean {
    return false;
  }
  canPublish(): boolean {
    return false;
  }
  canArchive(): boolean {
    return true;
  }
  canRestore(): boolean {
    return false;
  }
  transitionTo(target: ProjectLifecycleStatus): boolean {
    return target === 'archived' || target === 'draft';
  }
}

/** Class implementing archived state. */
export class ArchivedState implements IProjectState {
  readonly status: ProjectLifecycleStatus = 'archived';

  canEdit(): boolean {
    return false;
  }
  canBuild(): boolean {
    return false;
  }
  canRequestApproval(): boolean {
    return false;
  }
  canPublish(): boolean {
    return false;
  }
  canArchive(): boolean {
    return false;
  }
  canRestore(): boolean {
    return true;
  }
  transitionTo(target: ProjectLifecycleStatus): boolean {
    return target === 'draft' || target === 'ready';
  }
}

/** Class implementing project state factory. */
export class ProjectStateFactory {
  static create(status: ProjectLifecycleStatus): IProjectState {
    switch (status) {
      case 'draft':
        return new DraftState();
      case 'building':
        return new BuildingState();
      case 'ready':
        return new ReadyState();
      case 'pending_approval':
        return new PendingApprovalState();
      case 'published':
        return new PublishedState();
      case 'archived':
        return new ArchivedState();
      default:
        return new DraftState();
    }
  }
}
