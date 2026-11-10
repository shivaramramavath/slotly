// React component coordinating project section slots or flat search results dispatching.
'use client';

import type { ProjectDto } from '@slotly/contracts';
import { PROJECT_SECTIONS } from './project-sections.registry';
import { ProjectSection } from './project-section';
import { ProjectCollection, type ProjectLayoutMode } from './project-collection';
import { selectSectionProjects, selectFlatResults, isFilteringActive } from './project-selectors';

/** Props for ProjectsSections coordinator component. */
export interface ProjectsSectionsProps {
  projects: ProjectDto[];
  layout: ProjectLayoutMode;
  search: string;
  statusFilter: string;
  visibleSections: Record<string, boolean>;
  collapsedSections: Record<string, boolean>;
  onToggleCollapse: (sectionId: string) => void;
  onDuplicate?: ((project: ProjectDto) => void) | undefined;
  onArchive?: ((project: ProjectDto) => void) | undefined;
  onRestore?: ((project: ProjectDto) => void) | undefined;
  onTogglePin?: ((project: ProjectDto) => void) | undefined;
  pendingProjectIds?: Set<string> | undefined;
}

/** React component rendering organized project slots or single flat filtered result list. */
export function ProjectsSections({
  projects,
  layout,
  search,
  statusFilter,
  visibleSections,
  collapsedSections,
  onToggleCollapse,
  onDuplicate,
  onArchive,
  onRestore,
  onTogglePin,
  pendingProjectIds,
}: ProjectsSectionsProps) {
  const isFiltered = isFilteringActive(search, statusFilter);

  // Flat results mode when user is searching or filtering by status
  if (isFiltered) {
    const results = selectFlatResults(projects, search, statusFilter);

    return (
      <div className="space-y-6">
        <div className="flex items-baseline justify-between pb-2 border-b border-[#181818]">
          <h2 className="text-[18px] font-medium text-[#FAFAFA] tracking-tight leading-snug">
            Results <span className="font-mono text-xs text-[#8A8A8A]">({results.length})</span>
          </h2>
          <span className="font-mono text-xs text-[#8A8A8A]">
            Filtered by {search ? `"${search}"` : ''} {statusFilter ? `[${statusFilter}]` : ''}
          </span>
        </div>

        {results.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#232323] p-12 text-center bg-[#0D0D0D]">
            <p className="text-sm font-medium text-[#FAFAFA] mb-1">No matching projects found</p>
            <p className="text-xs font-mono text-[#8A8A8A]">
              Try clearing your search query or choosing another status filter.
            </p>
          </div>
        ) : (
          <ProjectCollection
            projects={results}
            layout={layout}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onRestore={onRestore}
            onTogglePin={onTogglePin}
            pendingProjectIds={pendingProjectIds}
          />
        )}
      </div>
    );
  }

  // Standard organized slots view
  return (
    <div className="space-y-2">
      {PROJECT_SECTIONS.map((config) => {
        // Skip if user toggled this section off in View menu
        if (visibleSections[config.id] === false) {
          return null;
        }

        const sectionProjects = selectSectionProjects(projects, config);
        const isCollapsed =
          collapsedSections[config.id] !== undefined
            ? collapsedSections[config.id]
            : config.defaultCollapsed ?? false;

        return (
          <ProjectSection
            key={config.id}
            config={config}
            projects={sectionProjects}
            layout={layout}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onRestore={onRestore}
            onTogglePin={onTogglePin}
            pendingProjectIds={pendingProjectIds}
          />
        );
      })}
    </div>
  );
}
