'use client';

import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';

interface ReadinessDialogProps {
  onBuildSchedule: () => void;
}

export function ReadinessDialog({ onBuildSchedule }: ReadinessDialogProps) {
  const isReadinessOpen = useBlueprintStore((s) => s.isReadinessOpen);
  const setIsReadinessOpen = useBlueprintStore((s) => s.setIsReadinessOpen);
  const nodes = useBlueprintStore((s) => s.nodes);
  const selectNode = useBlueprintStore((s) => s.selectNode);
  const setFixHint = useBlueprintStore((s) => s.setFixHint);
  const setActiveTab = useBlueprintStore((s) => s.setActiveTab);

  if (!isReadinessOpen) return null;

  const total = nodes.length;
  const complete = nodes.filter((n) => n.data.effectiveStatus === 'complete').length;
  const incomplete = nodes.filter((n) => n.data.effectiveStatus === 'incomplete').length;
  const blocked = nodes.filter((n) => n.data.effectiveStatus === 'blocked').length;

  const score = total > 0 ? Math.round((complete / total) * 100) : 0;
  const isReadyToBuild = score === 100 && total > 0;

  const handleGoFix = (nodeId: string, field?: string) => {
    selectNode(nodeId);
    setActiveTab('config');
    if (field) {
      setFixHint({ nodeId, field });
    }
    setIsReadinessOpen(false);
  };

  return (
    <Dialog open={isReadinessOpen} onOpenChange={setIsReadinessOpen}>
      <DialogHeader>
        <div className="flex items-center gap-2 text-[#22C55E] mb-1">
          <ShieldCheck className="h-5 w-5" />
          <DialogTitle className="text-sm font-semibold text-[#FAFAFA]">
            Blueprint Solver Readiness (G5 Gate)
          </DialogTitle>
        </div>
        <DialogDescription className="text-xs text-[#8A8A8A]">
          Verification check required before passing graph to the Timetable Constraint Solver.
        </DialogDescription>
      </DialogHeader>

      <div className="my-3 space-y-3">
        {/* Readiness Score meter */}
        <div className="p-3 rounded-md bg-[#161616] border border-[#232323] space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#8A8A8A]">Readiness Score</span>
            <span className={score === 100 ? 'text-[#22C55E] font-bold' : 'text-[#FACC15] font-bold'}>
              {score}% Complete
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[#0A0A0A] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${score === 100 ? 'bg-[#22C55E]' : 'bg-[#FACC15]'}`}
              style={{ width: `${score}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-1">
            <div>
              <span className="text-[#22C55E] font-bold">{complete}</span>
              <span className="text-[10px] text-[#8A8A8A] block">Complete</span>
            </div>
            <div>
              <span className="text-[#FACC15] font-bold">{incomplete}</span>
              <span className="text-[10px] text-[#8A8A8A] block">Incomplete</span>
            </div>
            <div>
              <span className="text-[#8A8A8A] font-bold">{blocked}</span>
              <span className="text-[10px] text-[#8A8A8A] block">Blocked</span>
            </div>
          </div>
        </div>

        {/* Missing items checklist with Go Fix links */}
        <div className="max-h-56 overflow-y-auto space-y-1.5">
          {incomplete === 0 && blocked === 0 ? (
            <div className="p-4 text-center text-xs text-[#8A8A8A] flex flex-col items-center">
              <CheckCircle2 className="h-8 w-8 text-[#22C55E] mb-2" />
              <span className="text-[#FAFAFA] font-medium">All Requirements Met</span>
              <span className="text-[10px] font-mono mt-0.5">
                G5 Build gate passed. Ready to generate conflict-free schedules!
              </span>
            </div>
          ) : (
            nodes
              .filter((n) => n.data.effectiveStatus !== 'complete')
              .map((node) => (
                <div
                  key={node.id}
                  className="p-2 rounded bg-[#161616] border border-[#232323] text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#FAFAFA] truncate">{node.data.label}</span>
                      <Badge
                        variant={node.data.effectiveStatus === 'blocked' ? 'neutral' : 'yellow'}
                        className="text-[9px]"
                      >
                        {node.data.effectiveStatus}
                      </Badge>
                    </div>
                    {node.data.missing.length > 0 && (
                      <div className="text-[10px] text-[#8A8A8A] font-mono truncate mt-0.5">
                        Missing: {node.data.missing.map((m) => m.field).join(', ')}
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-[#FACC15] hover:text-[#FAFAFA] gap-1 shrink-0"
                    onClick={() => handleGoFix(node.id, node.data.missing[0]?.field)}
                  >
                    <span>Go fix</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              ))
          )}
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => setIsReadinessOpen(false)}>
          Close
        </Button>

        {/* G5 Gated Build Button */}
        <Button
          variant="primary"
          size="sm"
          disabled={!isReadyToBuild}
          onClick={() => {
            setIsReadinessOpen(false);
            onBuildSchedule();
          }}
          className="gap-1.5"
          title={!isReadyToBuild ? 'Build is gated: 100% readiness required (G5)' : 'Start generation'}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isReadyToBuild ? 'Generate Schedule' : 'Build Gated (Resolve Incomplete)'}</span>
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
