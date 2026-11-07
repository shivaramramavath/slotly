import type { ProjectLifecycleStatus } from '@slotly/contracts';

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
