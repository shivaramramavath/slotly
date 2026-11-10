// React component dispatching project collections across grid, list, and compact layouts.
'use client';

import type { ProjectDto } from '@slotly/contracts';
import { ProjectCard, ProjectCardSkeleton } from './project-card';
import { ProjectRow, ProjectRowSkeleton } from './project-row';

/** Supported layout view modes for project collections. */
export type ProjectLayoutMode = 'grid' | 'list' | 'compact';

/** Props for ProjectCollection component. */
export interface ProjectCollectionProps {
  projects: ProjectDto[];
  layout: ProjectLayoutMode;
  onDuplicate?: ((project: ProjectDto) => void) | undefined;
  onArchive?: ((project: ProjectDto) => void) | undefined;
  onRestore?: ((project: ProjectDto) => void) | undefined;
  onTogglePin?: ((project: ProjectDto) => void) | undefined;
  pendingProjectIds?: Set<string> | undefined;
}

/** React component rendering collection of academic projects in user-chosen layout. */
export function ProjectCollection({
  projects,
  layout,
  onDuplicate,
  onArchive,
  onRestore,
  onTogglePin,
  pendingProjectIds,
}: ProjectCollectionProps) {
  if (projects.length === 0) {
    return null;
  }

  if (layout === 'list') {
    return (
      <div className="flex flex-col gap-2.5">
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onRestore={onRestore}
            onTogglePin={onTogglePin}
            isPending={pendingProjectIds?.has(project.id)}
          />
        ))}
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            density="compact"
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onRestore={onRestore}
            onTogglePin={onTogglePin}
            isPending={pendingProjectIds?.has(project.id)}
          />
        ))}
      </div>
    );
  }

  // Default: Grid layout (3 cols >= 1024px, 2 cols 640-1023px, 1 col below)
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          density="normal"
          onDuplicate={onDuplicate}
          onArchive={onArchive}
          onRestore={onRestore}
          onTogglePin={onTogglePin}
          isPending={pendingProjectIds?.has(project.id)}
        />
      ))}
    </div>
  );
}

/** Skeleton placeholder for project collections matching active layout mode. */
export function ProjectCollectionSkeleton({
  layout = 'grid',
  count = 6,
}: {
  layout?: ProjectLayoutMode;
  count?: number;
}) {
  const items = Array.from({ length: count }, (_, i) => i);

  if (layout === 'list') {
    return (
      <div className="flex flex-col gap-2.5">
        {items.map((i) => (
          <ProjectRowSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
        {items.map((i) => (
          <ProjectCardSkeleton key={i} density="compact" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
      {items.map((i) => (
        <ProjectCardSkeleton key={i} density="normal" />
      ))}
    </div>
  );
}
