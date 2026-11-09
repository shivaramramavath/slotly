// Project card component implementing sys0 visual language, stretched link overlay, and status indicators.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, MoreHorizontal, Settings, Copy, Archive, Loader2 } from 'lucide-react';
import { SurfaceCard } from '@/components/ui/surface-card';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProjectDto, ProjectLifecycleStatus } from '@slotly/contracts';

/** Props for ProjectCard component. */
export interface ProjectCardProps {
  project: ProjectDto;
  onDuplicate?: (project: ProjectDto) => void;
  onArchive?: (project: ProjectDto) => void;
  isPending?: boolean;
}

/** Formats opened date to compact visual format: "opened 9 Nov". */
export function formatOpenedMeta(revision: number, lastOpenedAt?: string | null): string {
  if (!lastOpenedAt) {
    return `Rev ${revision} · Not opened yet`;
  }
  const date = new Date(lastOpenedAt);
  if (isNaN(date.getTime())) {
    return `Rev ${revision} · Not opened yet`;
  }
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `Rev ${revision} · opened ${day} ${month}`;
}

/** Helper generating fallback description text based on project configuration. */
export function getProjectDescription(project: ProjectDto): string {
  const settings = project.settings;
  const daysCount = settings?.days?.length || 5;
  const periodsCount = settings?.periodsPerDay || 7;
  const strictness = project.strictness || 'strict';

  return `${daysCount} days a week, ${periodsCount} periods a day, ${strictness} mode.`;
}

/** Returns status label color token. */
export function getStatusColorClass(status: ProjectLifecycleStatus): string {
  switch (status) {
    case 'published':
      return 'text-[#22C55E]';
    case 'building':
    case 'pending_approval':
      return 'text-[#FACC15]';
    case 'ready':
      return 'text-[#22C55E]';
    case 'draft':
    case 'archived':
    default:
      return 'text-[#8A8A8A]';
  }
}

/** React component rendering single academic project card with stretched link overlay and isolated action dropdown. */
export function ProjectCard({
  project,
  onDuplicate,
  onArchive,
  isPending = false,
}: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const canvasHref = `/projects/${project.id}/blueprint`;
  const settingsHref = `/projects/${project.id}/settings`;
  const statusColor = getStatusColorClass(project.status);
  const openedMeta = formatOpenedMeta(project.revision, project.lastOpenedAt);
  const description = getProjectDescription(project);

  const termKind = project.term?.kind ? project.term.kind.toUpperCase() : 'TERM';
  const termRange =
    project.term?.startDate && project.term?.endDate
      ? `${project.term.startDate} to ${project.term.endDate}`
      : 'Dates not set';
  const subtitle = `${termKind} term ${termRange}`;

  return (
    <SurfaceCard
      variant="link"
      className={`${isPending ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {/* Primary Stretched Link Overlay - Covers the entire card */}
      <Link
        href={canvasHref}
        aria-label={`Open project canvas for ${project.name}`}
        className="absolute inset-0 z-10 rounded-[20px] focus:outline-none"
      />

      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3">
        {/* Glyph Icon */}
        <div
          className="h-8 w-8 rounded-lg bg-[#181818] border border-[#232323] flex items-center justify-center text-[#FAFAFA]/90 shrink-0"
          aria-hidden="true"
        >
          <Calendar className="h-4 w-4" />
        </div>

        {/* Status label + Arrow + Actions menu button */}
        <div className="flex items-center gap-2 relative z-20">
          <div
            className={`flex items-center gap-1 font-mono text-xs ${statusColor} select-none`}
          >
            <span className="capitalize">{project.status.replace('_', ' ')}</span>
            <span
              className="inline-block transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            >
              &rarr;
            </span>
          </div>

          {/* Action Menu (Visible on hover, on focus-within, and always on touch) */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-label={`Options for ${project.name}`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="h-8 w-8 rounded-lg border border-transparent hover:border-[#232323] hover:bg-[#181818] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center transition-all cursor-pointer opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 mt-1.5 w-44 rounded-xl border border-[#232323] bg-[#111111] p-1 shadow-2xl text-xs z-30 animate-in fade-in zoom-in-95 duration-100"
              >
                <Link
                  href={settingsHref}
                  role="menuitem"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#181818] transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 text-[#8A8A8A]" />
                  <span>Settings</span>
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDuplicate?.(project);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#181818] transition-colors cursor-pointer text-left"
                >
                  <Copy className="h-3.5 w-3.5 text-[#8A8A8A]" />
                  <span>Duplicate</span>
                </button>

                {project.status !== 'archived' && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMenuOpen(false);
                      onArchive?.(project);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer text-left"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span>Archive</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Content: Title, Subtitle, Description */}
      <div className="my-5 space-y-2">
        <h2 className="text-[20px] font-medium text-[#FAFAFA] tracking-tight leading-snug line-clamp-2">
          {project.name}
        </h2>
        <p className="font-mono text-xs text-[#8A8A8A] tracking-tight truncate">
          {subtitle}
        </p>
        <p className="text-sm leading-[22px] text-[#8A8A8A] line-clamp-3 pt-1">
          {description}
        </p>
      </div>

      {/* Pinned Footer Row */}
      <div className="flex items-center justify-between pt-2 border-t border-[#181818] text-xs font-mono text-[#8A8A8A]">
        {/* Left: 3-bar indicator + label */}
        <StatusIndicator
          status={project.status}
          blueprintProgress={project.blueprintProgress}
        />

        {/* Right: Revision + Opened metadata */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isPending && <Loader2 className="h-3 w-3 animate-spin text-[#FACC15]" />}
          <span className="truncate">{openedMeta}</span>
        </div>
      </div>
    </SurfaceCard>
  );
}

/** Skeleton placeholder component matching ProjectCard structure and dimensions. */
export function ProjectCardSkeleton() {
  return (
    <div
      className="rounded-[20px] border border-[#232323] bg-[#111111] p-6 min-h-[270px] flex flex-col justify-between"
      aria-busy="true"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-8 rounded-lg bg-[#181818] motion-reduce:animate-none" />
        <Skeleton className="h-4 w-16 bg-[#181818] rounded motion-reduce:animate-none" />
      </div>

      <div className="my-5 space-y-2.5">
        <Skeleton className="h-6 w-3/4 bg-[#181818] rounded motion-reduce:animate-none" />
        <Skeleton className="h-3 w-1/2 bg-[#181818] rounded motion-reduce:animate-none" />
        <div className="space-y-1.5 pt-1">
          <Skeleton className="h-3.5 w-full bg-[#181818] rounded motion-reduce:animate-none" />
          <Skeleton className="h-3.5 w-5/6 bg-[#181818] rounded motion-reduce:animate-none" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#181818]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-3 bg-[#181818] rounded-sm motion-reduce:animate-none" />
          <Skeleton className="h-3.5 w-16 bg-[#181818] rounded motion-reduce:animate-none" />
        </div>
        <Skeleton className="h-3 w-24 bg-[#181818] rounded motion-reduce:animate-none" />
      </div>
    </div>
  );
}
