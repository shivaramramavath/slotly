// React component rendering a single configurable project section slot with accessible header and collapse control.
'use client';

import { ChevronDown, ChevronRight } from 'lucide-react';
import type { ProjectDto } from '@slotly/contracts';
import type { ProjectSectionConfig } from './project-sections.registry';
import { ProjectCollection, type ProjectLayoutMode } from './project-collection';

/** Props for ProjectSection component. */
export interface ProjectSectionProps {
  config: ProjectSectionConfig;
  projects: ProjectDto[];
  layout: ProjectLayoutMode;
  isCollapsed?: boolean | undefined;
  onToggleCollapse?: ((sectionId: string) => void) | undefined;
  onDuplicate?: ((project: ProjectDto) => void) | undefined;
  onArchive?: ((project: ProjectDto) => void) | undefined;
  onRestore?: ((project: ProjectDto) => void) | undefined;
  onTogglePin?: ((project: ProjectDto) => void) | undefined;
  pendingProjectIds?: Set<string> | undefined;
}

/** React component rendering single academic project section slot matching sys0 visual guidelines. */
export function ProjectSection({
  config,
  projects,
  layout,
  isCollapsed = false,
  onToggleCollapse,
  onDuplicate,
  onArchive,
  onRestore,
  onTogglePin,
  pendingProjectIds,
}: ProjectSectionProps) {
  if (projects.length === 0 && config.hideWhenEmpty) {
    return null;
  }

  const contentId = `section-${config.id}-content`;
  const isCollapsible = Boolean(config.collapsible);
  const Icon = config.icon;

  return (
    <section aria-labelledby={`section-heading-${config.id}`} className="mt-10 first:mt-0">
      {/* Section Header: 40px spacing above (mt-10), 24px below (mb-6) */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-[#181818]">
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-[#8A8A8A] shrink-0" aria-hidden="true" />}
          <div className="flex items-baseline gap-2 min-w-0">
            <h2
              id={`section-heading-${config.id}`}
              className="text-[18px] font-medium text-[#FAFAFA] tracking-tight leading-snug truncate"
            >
              {config.title}
            </h2>
            <span className="font-mono text-xs text-[#8A8A8A] shrink-0">
              ({projects.length})
            </span>
          </div>
          {config.description && (
            <span className="hidden md:inline text-[13px] text-[#8A8A8A] ml-2 truncate">
              · {config.description}
            </span>
          )}
        </div>

        {isCollapsible && (
          <button
            type="button"
            aria-expanded={!isCollapsed}
            aria-controls={contentId}
            aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${config.title} section`}
            onClick={() => onToggleCollapse?.(config.id)}
            className="h-8 px-2.5 rounded-lg border border-[#232323] hover:border-[#383838] bg-[#111111] hover:bg-[#181818] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer"
          >
            <span>{isCollapsed ? 'Show' : 'Hide'}</span>
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Section Content */}
      <div id={contentId} hidden={isCollapsed}>
        {projects.length === 0 ? (
          <div className="rounded-[16px] border border-dashed border-[#232323] p-8 text-center bg-[#0D0D0D]">
            <p className="text-xs font-mono text-[#8A8A8A]">
              {config.emptyHint || 'No projects in this section.'}
            </p>
          </div>
        ) : (
          <ProjectCollection
            projects={projects}
            layout={layout}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onRestore={onRestore}
            onTogglePin={onTogglePin}
            pendingProjectIds={pendingProjectIds}
          />
        )}
      </div>
    </section>
  );
}
