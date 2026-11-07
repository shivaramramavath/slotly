'use client';

import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  GitCompare,
  Calendar,
  Award,
} from 'lucide-react';
import type { ScheduleVersionDto } from '@slotly/contracts';

interface AlternativeCardProps {
  version: ScheduleVersionDto;
  projectId: string;
  isCompared?: boolean;
  onToggleCompare?: (version: ScheduleVersionDto) => void;
  isComparingFull?: boolean;
}

export function AlternativeCard({
  version,
  projectId,
  isCompared = false,
  onToggleCompare,
  isComparingFull = false,
}: AlternativeCardProps) {
  const hardConflicts =
    version.conflicts?.filter(
      (c) => c.type === 'hard' || c.severity === 'error',
    ) || [];
  const softWarnings =
    version.conflicts?.filter(
      (c) => c.type === 'soft' || c.severity === 'warning',
    ) || [];

  const stats = version.stats || {
    totalSlots: version.slots?.length || 0,
    occupiedSlots: version.slots?.length || 0,
    roomUtilizationPct: 0,
    facultyLoadBalanceScore: 0,
    afternoonLabPct: 0,
  };

  const formattedDate = new Date(version.createdAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`rounded-xl border transition-all duration-200 bg-[#0A0A0A] p-5 flex flex-col justify-between ${
        isCompared
          ? 'border-[#FACC15] ring-1 ring-[#FACC15]/30'
          : 'border-[#232323] hover:border-[#383838]'
      }`}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#232323] pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#111111] border border-[#232323] text-[#FACC15]">
                v{version.versionNo}
              </span>
              <h4 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">
                {version.label || `Alternative #${version.versionNo}`}
              </h4>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-[#8A8A8A] font-mono">
              <Calendar className="h-3 w-3" />
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="capitalize">{version.kind}</span>
            </div>
          </div>

          {/* Quality Score */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#111111] border border-[#232323]">
              <Award className="h-3.5 w-3.5 text-[#FACC15]" />
              <span className="font-mono text-xs font-bold text-[#FAFAFA]">
                {Math.round(version.score)}/100
              </span>
            </div>
          </div>
        </div>

        {/* Conflicts Status Badge */}
        <div className="mb-4">
          {hardConflicts.length === 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E] text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>Conflict-Free (0 hard violations)</span>
              {softWarnings.length > 0 && (
                <span className="text-[#8A8A8A] ml-auto font-mono text-[11px]">
                  {softWarnings.length} soft warnings
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] text-xs font-medium">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{hardConflicts.length} hard constraint conflict(s)</span>
            </div>
          )}
        </div>

        {/* Mini Stats 4-Grid */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-5">
          <div className="rounded-lg border border-[#232323] bg-[#111111] p-2.5">
            <span className="text-[#8A8A8A] block text-[11px]">Room Utilization</span>
            <span className="text-sm font-semibold text-[#FAFAFA]">
              {Math.round(stats.roomUtilizationPct)}%
            </span>
          </div>

          <div className="rounded-lg border border-[#232323] bg-[#111111] p-2.5">
            <span className="text-[#8A8A8A] block text-[11px]">Faculty Balance</span>
            <span className="text-sm font-semibold text-[#FAFAFA]">
              {Math.round(stats.facultyLoadBalanceScore)}%
            </span>
          </div>

          <div className="rounded-lg border border-[#232323] bg-[#111111] p-2.5">
            <span className="text-[#8A8A8A] block text-[11px]">Afternoon Labs</span>
            <span className="text-sm font-semibold text-[#FAFAFA]">
              {Math.round(stats.afternoonLabPct)}%
            </span>
          </div>

          <div className="rounded-lg border border-[#232323] bg-[#111111] p-2.5">
            <span className="text-[#8A8A8A] block text-[11px]">Slots Scheduled</span>
            <span className="text-sm font-semibold text-[#FAFAFA]">
              {stats.occupiedSlots || version.slots?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#232323]">
        {onToggleCompare && (
          <button
            onClick={() => onToggleCompare(version)}
            disabled={!isCompared && isComparingFull}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              isCompared
                ? 'border-[#FACC15] bg-[#FACC15]/10 text-[#FACC15]'
                : 'border-[#232323] bg-[#111111] text-[#8A8A8A] hover:text-[#FAFAFA] hover:border-[#383838]'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <GitCompare className="h-3.5 w-3.5" />
            <span>{isCompared ? 'Compared' : 'Compare'}</span>
          </button>
        )}

        <Link
          href={`/projects/${projectId}/editor?versionId=${version.id}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#FAFAFA] text-black px-4 py-2 text-xs font-semibold hover:bg-[#FAFAFA]/90 transition-colors shadow-sm"
        >
          <span>Open in Board</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
