'use client';

import { useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, AlertCircle, XCircle, Terminal } from 'lucide-react';
import type { BuildLogEntry } from '../store/builds.store';

interface BuildProgressPanelProps {
  status: 'idle' | 'building' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  currentMessage: string;
  logs: BuildLogEntry[];
  error?: string | null;
  onCancel?: () => void;
  isCancelling?: boolean;
}

export function BuildProgressPanel({
  status,
  progress,
  currentStep,
  currentMessage,
  logs,
  error,
  onCancel,
  isCancelling = false,
}: BuildProgressPanelProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
    <div className="rounded-xl border border-[#232323] bg-[#0A0A0A] p-6 text-[#FAFAFA] space-y-5">
      {/* Header and status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232323] pb-4">
        <div className="flex items-center gap-3">
          {status === 'building' && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#FACC15]/30 bg-[#FACC15]/10 text-[#FACC15]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {status === 'completed' && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
          {status === 'failed' && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
          {status === 'idle' && (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#232323] bg-[#111111] text-[#8A8A8A]">
              <Terminal className="h-5 w-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#FAFAFA]">
                {status === 'building' && 'Solver Execution in Progress'}
                {status === 'completed' && 'Timetable Generation Completed'}
                {status === 'failed' && 'Generation Failed'}
                {status === 'idle' && 'Generation Solver Idle'}
              </h3>
              <span className="font-mono text-xs text-[#8A8A8A]">
                [{progress}%]
              </span>
            </div>
            <p className="text-xs text-[#8A8A8A]">
              {currentMessage || 'Ready to run constraint satisfaction solver.'}
            </p>
          </div>
        </div>

        {status === 'building' && onCancel && (
          <button
            onClick={onCancel}
            disabled={isCancelling}
            className="flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-1.5 text-xs font-medium text-[#EF4444] hover:bg-[#EF4444]/20 disabled:opacity-50 transition-colors"
          >
            {isCancelling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <XCircle className="h-3.5 w-3.5" />
            )}
            <span>Abort Build</span>
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-[#8A8A8A]">{currentStep || 'INITIALIZING'}</span>
          <span className="text-[#FAFAFA] font-bold">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#111111] border border-[#232323]">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              status === 'failed'
                ? 'bg-[#EF4444]'
                : status === 'completed'
                ? 'bg-[#22C55E]'
                : 'bg-[#FACC15]'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>

      {/* Error alert if failed */}
      {error && (
        <div className="rounded-lg border border-[#EF4444]/30 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">
          <div className="font-semibold">Error during generation:</div>
          <div className="font-mono mt-1 text-[#FAFAFA]">{error}</div>
        </div>
      )}

      {/* Terminal log feed */}
      <div className="rounded-lg border border-[#232323] bg-[#000000] p-3">
        <div className="flex items-center justify-between border-b border-[#232323] pb-2 mb-2 text-xs text-[#8A8A8A] font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="h-3.5 w-3.5 text-[#FACC15]" />
            <span>EXECUTION_LOG ({logs.length} events)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span>LIVE_FEED</span>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto font-mono text-xs space-y-1 pr-1 scrollbar-thin scrollbar-thumb-[#232323]">
          {logs.length === 0 ? (
            <div className="text-[#8A8A8A] py-3 text-center italic">
              No solver logs yet. Click &quot;Generate Timetable&quot; to begin.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2.5 py-0.5 leading-relaxed text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors"
              >
                <span className="text-[#8A8A8A]/60 select-none shrink-0">
                  {log.timestamp}
                </span>
                <span className="text-[#FACC15] shrink-0 font-medium">
                  [{log.step}]
                </span>
                <span className="text-[#FAFAFA] break-all">{log.message}</span>
              </div>
            ))
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
