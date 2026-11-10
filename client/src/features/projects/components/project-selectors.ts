// Pure selector functions filtering, sorting, and partitioning projects for sections and search queries.
import type { ProjectDto } from '@slotly/contracts';
import type { ProjectSectionConfig } from './project-sections.registry';

/** Determines if search or status filtering is currently active. */
export function isFilteringActive(search: string, statusFilter: string): boolean {
  return search.trim().length > 0 || statusFilter.trim().length > 0;
}

/** Filters and limits projects for a specific section slot based on its configuration. */
export function selectSectionProjects(
  projects: ProjectDto[],
  config: ProjectSectionConfig,
): ProjectDto[] {
  let matched = projects.filter(config.filter);

  if (config.sort) {
    matched = [...matched].sort(config.sort);
  }

  if (typeof config.limit === 'number' && config.limit > 0) {
    matched = matched.slice(0, config.limit);
  }

  return matched;
}

/** Filters projects into a flat list when search or status filter is active. */
export function selectFlatResults(
  projects: ProjectDto[],
  search: string,
  statusFilter: string,
): ProjectDto[] {
  const query = search.trim().toLowerCase();
  const normalizedStatus = statusFilter.trim().toLowerCase();

  return projects.filter((project) => {
    // Status filter matching
    if (normalizedStatus && project.status !== normalizedStatus) {
      return false;
    }

    // Search query matching
    if (query) {
      const nameMatch = project.name.toLowerCase().includes(query);
      const termKindMatch = project.term?.kind?.toLowerCase().includes(query);
      if (!nameMatch && !termKindMatch) {
        return false;
      }
    }

    return true;
  });
}
