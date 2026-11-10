// React component rendering a single project as a compact horizontal list row.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { Calendar, MoreHorizontal, Settings, Copy, Archive, RotateCcw, Loader2 } from 'lucide-react';
import { StatusIndicator } from '@/components/ui/status-indicator';
import { PinButton } from './pin-button';
import { formatOpenedMeta } from './project-card';
import type { ProjectDto } from '@slotly/contracts';

/** Props for ProjectRow component. */
export interface ProjectRowProps {
  project: ProjectDto;
  onDuplicate?: ((project: ProjectDto) => void) | undefined;
  onArchive?: ((project: ProjectDto) => void) | undefined;
  onRestore?: ((project: ProjectDto) => void) | undefined;
  onTogglePin?: ((project: ProjectDto) => void) | undefined;
  isPending?: boolean | undefined;
}

/** React component rendering single academic project list row (72px height, 16px radius). */
export function ProjectRow({
  project,
  onDuplicate,
  onArchive,
  onRestore,
  onTogglePin,
  isPending = false,
}: ProjectRowProps) {
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
  const openedMeta = formatOpenedMeta(project.revision, project.lastOpenedAt);

  const termKind = project.term?.kind ? project.term.kind.toUpperCase() : 'TERM';
  const termRange =
    project.term?.startDate && project.term?.endDate
      ? `${project.term.startDate} to ${project.term.endDate}`
      : 'Dates not set';
  const subtitle = `${termKind} term ${termRange}`;
  const isArchived = project.status === 'archived';

  return (
    <div
      className={`group relative rounded-[16px] border border-[#232323] bg-[#111111] px-4 sm:px-6 h-[72px] flex items-center justify-between gap-4 transition-all duration-150 hover:border-[#383838] hover:bg-[#161616] focus-within:ring-2 focus-within:ring-[#FAFAFA] focus-within:ring-offset-2 focus-within:ring-offset-[#0A0A0A] ${
        isArchived ? 'opacity-70 hover:opacity-90' : ''
      } ${isPending ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {/* Stretched Link Overlay */}
      <Link
        href={canvasHref}
        aria-label={`Open project canvas for ${project.name}`}
        className="absolute inset-0 z-10 rounded-[16px] focus:outline-none"
      />

      {/* Left: Glyph + Title + Subtitle */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="h-8 w-8 rounded-lg bg-[#181818] border border-[#232323] flex items-center justify-center text-[#FAFAFA]/90 shrink-0"
          aria-hidden="true"
        >
          <Calendar className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] sm:text-[16px] font-medium text-[#FAFAFA] truncate tracking-tight">
              {project.name}
            </h3>
            <span className="hidden lg:inline text-xs font-mono text-[#8A8A8A] truncate max-w-[200px]">
              {subtitle}
            </span>
          </div>
        </div>
      </div>

      {/* Middle: Status indicator */}
      <div className="hidden sm:flex items-center shrink-0">
        <StatusIndicator
          status={project.status}
          blueprintProgress={project.blueprintProgress}
        />
      </div>

      {/* Right: Meta + Pin + Menu */}
      <div className="flex items-center gap-3 shrink-0 relative z-20">
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-[#8A8A8A]">
          {isPending && <Loader2 className="h-3 w-3 animate-spin text-[#FACC15]" />}
          <span>{openedMeta}</span>
        </div>

        <PinButton
          pinned={project.pinned}
          projectName={project.name}
          onToggle={() => onTogglePin?.(project)}
          disabled={isPending}
        />

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
              <button
                type="button"
                role="menuitem"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                  onTogglePin?.(project);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#181818] transition-colors cursor-pointer text-left"
              >
                <span>{project.pinned ? 'Unpin' : 'Pin to top'}</span>
              </button>

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

              {isArchived ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenuOpen(false);
                    onRestore?.(project);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#181818] transition-colors cursor-pointer text-left"
                >
                  <RotateCcw className="h-3.5 w-3.5 text-[#8A8A8A]" />
                  <span>Restore</span>
                </button>
              ) : (
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
  );
}

/** Skeleton placeholder component matching ProjectRow structure. */
export function ProjectRowSkeleton() {
  return (
    <div
      className="rounded-[16px] border border-[#232323] bg-[#111111] px-6 h-[72px] flex items-center justify-between gap-4"
      aria-busy="true"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="h-8 w-8 rounded-lg bg-[#181818] animate-pulse" />
        <div className="space-y-1.5 flex-1 max-w-sm">
          <div className="h-4 w-40 bg-[#181818] rounded animate-pulse" />
          <div className="h-3 w-28 bg-[#181818] rounded animate-pulse" />
        </div>
      </div>
      <div className="h-4 w-28 bg-[#181818] rounded animate-pulse hidden sm:block" />
      <div className="h-4 w-32 bg-[#181818] rounded animate-pulse hidden md:block" />
    </div>
  );
}
