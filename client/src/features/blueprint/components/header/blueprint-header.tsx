// React component for blueprint-header.
'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { projectsApi } from '@/features/projects/services/projects.api';
import { useBlueprintStore } from '../../store/blueprint.store';

export interface BlueprintHeaderProps {
  projectId: string;
  onOpenValidation: () => void;
  onBuildSchedule: () => void;
}

/** React component rendering single 48px Blueprint Header matching reference spec */
export function BlueprintHeader({
  projectId,
  onOpenValidation,
  onBuildSchedule,
}: BlueprintHeaderProps) {
  const revision = useBlueprintStore((s) => s.revision);
  const autosaveStatus = useBlueprintStore((s) => s.autosaveStatus);
  const nodes = useBlueprintStore((s) => s.nodes);
  const setIsReadinessOpen = useBlueprintStore((s) => s.setIsReadinessOpen);

  // Fetch project details for display name
  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
    staleTime: 60_000,
  });

  // Calculate readiness score
  const totalNodes = nodes.length;
  const completeNodes = nodes.filter((n) => n.data.effectiveStatus === 'complete').length;
  const readinessPercent = totalNodes > 0 ? Math.round((completeNodes / totalNodes) * 100) : 0;

  // Calculate issues count
  const incompleteCount = nodes.filter((n) => n.data.effectiveStatus === 'incomplete').length;
  const blockedCount = nodes.filter((n) => n.data.effectiveStatus === 'blocked').length;
  const issuesCount = incompleteCount + blockedCount;

  const canBuild = totalNodes > 0 && nodes.every((n) => n.data.effectiveStatus === 'complete');

  // Autosave label text
  let autosaveText = `Saved • rev ${revision || 1}`;
  if (autosaveStatus === 'saving') {
    autosaveText = 'Saving...';
  } else if (autosaveStatus === 'offline') {
    autosaveText = 'Offline';
  }

  return (
    <header className="h-12 border-b border-[#232323] px-4 flex items-center justify-between bg-[#0A0A0A] shrink-0 z-20 select-none">
      {/* Left: Back button + Project Name + Status Chip */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/projects" aria-label="Back to projects">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#8A8A8A] hover:text-[#FAFAFA] rounded-[8px]"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>

        {/* Project Name (with loading skeleton, NEVER database id) */}
        <div className="min-w-0 flex items-center gap-2.5">
          {isProjectLoading ? (
            <div
              data-testid="project-name-skeleton"
              className="h-4 w-32 bg-[#181818] rounded animate-pulse"
            />
          ) : (
            <h1
              data-testid="project-name"
              className="text-[14px] leading-none font-medium text-[#FAFAFA] truncate max-w-[200px] sm:max-w-[320px]"
            >
              {project?.name || 'Academic Project'}
            </h1>
          )}

          {/* 1px divider */}
          <div className="w-[1px] h-3.5 bg-[#232323] shrink-0" />

          {/* Project Status Chip */}
          <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded-[6px] bg-[#141414] text-[#8A8A8A] border border-[#232323] shrink-0">
            {project?.status || 'Draft'}
          </span>
        </div>
      </div>

      {/* Right: Autosave + Readiness Chip + Issues Chip + Studio Link + Build Button */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Autosave status text */}
        <span
          data-testid="autosave-status"
          className="font-mono text-[11px] text-[#8A8A8A] hidden sm:inline"
        >
          {autosaveText}
        </span>

        {/* Single Readiness Chip (opens readiness dialog) */}
        <button
          type="button"
          onClick={() => setIsReadinessOpen(true)}
          title="Open blueprint readiness analysis"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#111111] border border-[#232323] hover:border-[#383838] transition-colors font-mono text-[11px] text-[#FAFAFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {/* Mini progress ring */}
          <svg className="w-3.5 h-3.5 transform -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="#222222"
              strokeWidth="3"
              fill="none"
            />
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke={readinessPercent === 100 ? '#22C55E' : '#FAFAFA'}
              strokeWidth="3"
              strokeDasharray={56.5}
              strokeDashoffset={56.5 - (56.5 * readinessPercent) / 100}
              strokeLinecap="round"
              fill="none"
              className="transition-all duration-300"
            />
          </svg>
          <span>{readinessPercent}% Ready</span>
        </button>

        {/* Issues Chip (only when count > 0) */}
        {issuesCount > 0 && (
          <button
            type="button"
            onClick={onOpenValidation}
            title="View validation issues"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#141414] border border-[#EF4444]/40 hover:border-[#EF4444] text-[#FAFAFA] transition-colors font-mono text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
            <span>{issuesCount} {issuesCount === 1 ? 'issue' : 'issues'}</span>
          </button>
        )}

        {/* Primary Yellow "Build" Button */}
        <Button
          variant="primary"
          size="sm"
          className="h-8 px-3 text-xs gap-1.5 font-medium bg-[#FACC15] hover:bg-[#FACC15]/90 text-[#000]"
          onClick={onBuildSchedule}
          disabled={!canBuild}
          title={
            canBuild
              ? 'Start timetable generation'
              : 'All nodes must be complete to build schedule (G5)'
          }
        >
          <Sparkles className="h-3 w-3" />
          <span>Build</span>
        </Button>
      </div>
    </header>
  );
}
