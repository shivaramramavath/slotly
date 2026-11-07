'use client';

import Link from 'next/link';
import {
  X,
  GitCompare,
  ArrowRight,
} from 'lucide-react';
import type { ScheduleVersionDto } from '@slotly/contracts';

interface CompareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  versionA: ScheduleVersionDto | null;
  versionB: ScheduleVersionDto | null;
  projectId: string;
}

export function CompareDialog({
  isOpen,
  onClose,
  versionA,
  versionB,
  projectId,
}: CompareDialogProps) {
  if (!isOpen || !versionA || !versionB) return null;

  const statsA = versionA.stats || {
    totalSlots: versionA.slots?.length || 0,
    occupiedSlots: versionA.slots?.length || 0,
    roomUtilizationPct: 0,
    facultyLoadBalanceScore: 0,
    afternoonLabPct: 0,
  };

  const statsB = versionB.stats || {
    totalSlots: versionB.slots?.length || 0,
    occupiedSlots: versionB.slots?.length || 0,
    roomUtilizationPct: 0,
    facultyLoadBalanceScore: 0,
    afternoonLabPct: 0,
  };

  const hardA =
    versionA.conflicts?.filter(
      (c) => c.type === 'hard' || c.severity === 'error',
    ).length || 0;
  const hardB =
    versionB.conflicts?.filter(
      (c) => c.type === 'hard' || c.severity === 'error',
    ).length || 0;

  const softA =
    versionA.conflicts?.filter(
      (c) => c.type === 'soft' || c.severity === 'warning',
    ).length || 0;
  const softB =
    versionB.conflicts?.filter(
      (c) => c.type === 'soft' || c.severity === 'warning',
    ).length || 0;

  const metrics = [
    {
      name: 'Constraint Score',
      valA: `${Math.round(versionA.score)}/100`,
      valB: `${Math.round(versionB.score)}/100`,
      winner:
        versionA.score > versionB.score
          ? 'A'
          : versionB.score > versionA.score
          ? 'B'
          : 'tie',
    },
    {
      name: 'Hard Conflicts',
      valA: `${hardA}`,
      valB: `${hardB}`,
      winner: hardA < hardB ? 'A' : hardB < hardA ? 'B' : 'tie',
    },
    {
      name: 'Soft Warnings',
      valA: `${softA}`,
      valB: `${softB}`,
      winner: softA < softB ? 'A' : softB < softA ? 'B' : 'tie',
    },
    {
      name: 'Room Utilization',
      valA: `${Math.round(statsA.roomUtilizationPct)}%`,
      valB: `${Math.round(statsB.roomUtilizationPct)}%`,
      winner:
        statsA.roomUtilizationPct > statsB.roomUtilizationPct
          ? 'A'
          : statsB.roomUtilizationPct > statsA.roomUtilizationPct
          ? 'B'
          : 'tie',
    },
    {
      name: 'Faculty Load Balance',
      valA: `${Math.round(statsA.facultyLoadBalanceScore)}%`,
      valB: `${Math.round(statsB.facultyLoadBalanceScore)}%`,
      winner:
        statsA.facultyLoadBalanceScore > statsB.facultyLoadBalanceScore
          ? 'A'
          : statsB.facultyLoadBalanceScore > statsA.facultyLoadBalanceScore
          ? 'B'
          : 'tie',
    },
    {
      name: 'Afternoon Lab %',
      valA: `${Math.round(statsA.afternoonLabPct)}%`,
      valB: `${Math.round(statsB.afternoonLabPct)}%`,
      winner:
        statsA.afternoonLabPct > statsB.afternoonLabPct
          ? 'A'
          : statsB.afternoonLabPct > statsA.afternoonLabPct
          ? 'B'
          : 'tie',
    },
    {
      name: 'Scheduled Slots',
      valA: `${statsA.occupiedSlots || versionA.slots?.length || 0}`,
      valB: `${statsB.occupiedSlots || versionB.slots?.length || 0}`,
      winner: 'tie',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl rounded-xl border border-[#232323] bg-[#0A0A0A] p-6 shadow-2xl text-[#FAFAFA] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#232323] pb-4 mb-6">
          <div className="flex items-center gap-2.5">
            <GitCompare className="h-5 w-5 text-[#FACC15]" />
            <div>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">
                Side-by-Side Alternative Comparison
              </h3>
              <p className="text-xs text-[#8A8A8A]">
                Evaluating constraint adherence and distribution metrics between candidate timetables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#8A8A8A] hover:bg-[#111111] hover:text-[#FAFAFA] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Alternatives Top Column Headers */}
        <div className="grid grid-cols-12 gap-4 pb-3 border-b border-[#232323] font-mono text-xs">
          <div className="col-span-4 text-[#8A8A8A] uppercase tracking-wider">Metric</div>
          <div className="col-span-4 flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-[#111111] border border-[#232323] text-[#FACC15]">
              v{versionA.versionNo}
            </span>
            <span className="font-semibold text-[#FAFAFA] truncate">
              {versionA.label || `Alternative #${versionA.versionNo}`}
            </span>
          </div>
          <div className="col-span-4 flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-[#111111] border border-[#232323] text-[#FACC15]">
              v{versionB.versionNo}
            </span>
            <span className="font-semibold text-[#FAFAFA] truncate">
              {versionB.label || `Alternative #${versionB.versionNo}`}
            </span>
          </div>
        </div>

        {/* Metrics Rows */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#232323] font-mono text-xs py-1">
          {metrics.map((m, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4 py-3 items-center">
              <div className="col-span-4 text-[#8A8A8A] font-sans font-medium">
                {m.name}
              </div>
              <div
                className={`col-span-4 font-semibold ${
                  m.winner === 'A' ? 'text-[#22C55E]' : 'text-[#FAFAFA]'
                }`}
              >
                {m.valA}
                {m.winner === 'A' && (
                  <span className="ml-1.5 text-[10px] text-[#22C55E] uppercase">
                    (better)
                  </span>
                )}
              </div>
              <div
                className={`col-span-4 font-semibold ${
                  m.winner === 'B' ? 'text-[#22C55E]' : 'text-[#FAFAFA]'
                }`}
              >
                {m.valB}
                {m.winner === 'B' && (
                  <span className="ml-1.5 text-[10px] text-[#22C55E] uppercase">
                    (better)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#232323] mt-4">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-[#232323] bg-[#111111] text-xs font-medium text-[#FAFAFA] hover:bg-[#232323] transition-colors"
          >
            Close Comparison
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              href={`/projects/${projectId}/editor?versionId=${versionA.id}`}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-[#232323] bg-[#111111] px-4 py-2 text-xs font-medium text-[#FAFAFA] hover:border-[#383838] transition-colors"
            >
              <span>Open v{versionA.versionNo} in Board</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>

            <Link
              href={`/projects/${projectId}/editor?versionId=${versionB.id}`}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-[#FAFAFA] text-black px-4 py-2 text-xs font-semibold hover:bg-[#FAFAFA]/90 transition-colors shadow-sm"
            >
              <span>Open v{versionB.versionNo} in Board</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
