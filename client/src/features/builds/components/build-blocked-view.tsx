'use client';

import Link from 'next/link';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import type { BlueprintReadinessDto } from '@slotly/contracts';

interface BuildBlockedViewProps {
  projectId: string;
  readiness: BlueprintReadinessDto;
}

export function BuildBlockedView({ projectId, readiness }: BuildBlockedViewProps) {
  return (
    <div className="rounded-xl border border-[#232323] bg-[#0A0A0A] p-6 text-[#FAFAFA]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-[#232323] pb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#FAFAFA]">
              Build Blocked: Blueprint Incomplete
            </h2>
            <p className="text-xs text-[#8A8A8A]">
              Gate G5 requires all nodes to be valid and complete with zero blocked descendants before schedule generation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-[#8A8A8A] uppercase font-mono tracking-wider">Health Score</span>
            <div className="text-2xl font-bold font-mono text-[#FACC15]">
              {readiness.healthScore}%
            </div>
          </div>
          <Link
            href={`/projects/${projectId}/blueprint`}
            className="flex items-center gap-2 rounded-lg bg-[#FACC15] px-4 py-2 text-xs font-semibold text-black hover:bg-[#FACC15]/90 transition-colors"
          >
            Open Blueprint
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-[#232323] bg-[#111111] p-3">
          <div className="flex justify-between text-xs text-[#8A8A8A] mb-1 font-mono">
            <span>Completed Nodes</span>
            <span className="text-[#FAFAFA]">
              {readiness.completedCount}/{readiness.totalNodes}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#232323] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#22C55E]"
              style={{
                width: `${readiness.totalNodes > 0 ? (readiness.completedCount / readiness.totalNodes) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#232323] bg-[#111111] p-3">
          <div className="flex justify-between text-xs text-[#8A8A8A] mb-1 font-mono">
            <span>Blocked Nodes</span>
            <span className="text-[#EF4444]">
              {readiness.blockedCount}/{readiness.totalNodes}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#232323] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#EF4444]"
              style={{
                width: `${readiness.totalNodes > 0 ? (readiness.blockedCount / readiness.totalNodes) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-[#232323] bg-[#111111] p-3">
          <div className="flex justify-between text-xs text-[#8A8A8A] mb-1 font-mono">
            <span>Overall Readiness</span>
            <span className={readiness.isReadyForBuild ? 'text-[#22C55E]' : 'text-[#EF4444]'}>
              {readiness.isReadyForBuild ? 'Ready (G5 Met)' : 'G5 Failed'}
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#232323] rounded-full overflow-hidden">
            <div
              className={`h-full ${readiness.isReadyForBuild ? 'bg-[#22C55E]' : 'bg-[#EF4444]'}`}
              style={{ width: `${readiness.healthScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Missing items list */}
      {readiness.missingItems && readiness.missingItems.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8A8A8A] font-mono mb-3">
            Missing Blueprint Requirements ({readiness.missingItems.length})
          </h3>
          <div className="divide-y divide-[#232323] rounded-lg border border-[#232323] bg-[#111111]">
            {readiness.missingItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[#232323] text-[#8A8A8A] uppercase">
                    {item.nodeType}
                  </span>
                  <span className="text-[#FAFAFA]">{item.nodeName}</span>
                  <span className="text-[#8A8A8A] font-mono">
                    ({item.message})
                  </span>
                </div>
                <Link
                  href={`/projects/${projectId}/blueprint?focusNode=${item.nodeId}`}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#FACC15] hover:underline shrink-0"
                >
                  <span>Go fix</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
