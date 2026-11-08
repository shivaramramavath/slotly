// Core implementation for project-state.interface in server/src/modules/projects/lifecycle.
import type { ProjectLifecycleStatus } from '@slotly/contracts';

/** Interface defining structure for project state. */
export interface IProjectState {
  readonly status: ProjectLifecycleStatus;
  canEdit(): boolean;
  canBuild(): boolean;
  canRequestApproval(): boolean;
  canPublish(): boolean;
  canArchive(): boolean;
  canRestore(): boolean;
  transitionTo(target: ProjectLifecycleStatus): boolean;
}
