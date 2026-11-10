// Registry defining standard project sections, filters, limits, and collapsible behavior.
import type { ProjectDto } from '@slotly/contracts';
import { Pin, Clock, FolderGit2, Archive } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Configuration interface for an academic project section slot. */
export interface ProjectSectionConfig {
  id: 'pinned' | 'recent' | 'all' | 'archived';
  title: string;
  description?: string;
  icon?: LucideIcon;
  filter: (project: ProjectDto) => boolean;
  sort?: (a: ProjectDto, b: ProjectDto) => number;
  limit?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  hideWhenEmpty?: boolean;
  emptyHint?: string;
}

/** 14 days in milliseconds. */
export const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/** Default registry defining the canonical 4 project sections in order. */
export const PROJECT_SECTIONS: ProjectSectionConfig[] = [
  {
    id: 'pinned',
    title: 'Pinned',
    description: 'Quick access to frequently referenced terms',
    icon: Pin,
    filter: (p) => p.status !== 'archived' && Boolean(p.pinned),
    sort: (a, b) => {
      const aTime = a.pinnedAt ? new Date(a.pinnedAt).getTime() : 0;
      const bTime = b.pinnedAt ? new Date(b.pinnedAt).getTime() : 0;
      return bTime - aTime;
    },
    limit: 12,
    collapsible: true,
    defaultCollapsed: false,
    hideWhenEmpty: true,
    emptyHint: 'Pin a project from its menu to see it in Pinned.',
  },
  {
    id: 'recent',
    title: 'Recent',
    description: 'Projects opened in the last 14 days',
    icon: Clock,
    filter: (p) => {
      if (p.status === 'archived' || p.pinned) return false;
      if (!p.lastOpenedAt) return false;
      const openedTime = new Date(p.lastOpenedAt).getTime();
      return !isNaN(openedTime) && Date.now() - openedTime <= FOURTEEN_DAYS_MS;
    },
    sort: (a, b) => {
      const aTime = a.lastOpenedAt ? new Date(a.lastOpenedAt).getTime() : 0;
      const bTime = b.lastOpenedAt ? new Date(b.lastOpenedAt).getTime() : 0;
      return bTime - aTime;
    },
    limit: 6,
    collapsible: false,
    defaultCollapsed: false,
    hideWhenEmpty: true,
  },
  {
    id: 'all',
    title: 'All projects',
    description: 'All active timetable terms and blueprint drafts',
    icon: FolderGit2,
    filter: (p) => p.status !== 'archived',
    collapsible: false,
    defaultCollapsed: false,
    hideWhenEmpty: false,
  },
  {
    id: 'archived',
    title: 'Archived',
    description: 'Read-only archived terms and historical drafts',
    icon: Archive,
    filter: (p) => p.status === 'archived',
    sort: (a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    },
    collapsible: true,
    defaultCollapsed: true,
    hideWhenEmpty: true,
    emptyHint: 'No archived projects.',
  },
];
