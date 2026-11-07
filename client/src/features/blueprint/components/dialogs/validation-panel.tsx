'use client';

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ValidationPanel({ isOpen, onClose }: ValidationPanelProps) {
  const nodes = useBlueprintStore((s) => s.nodes);
  const selectNode = useBlueprintStore((s) => s.selectNode);
  const setFixHint = useBlueprintStore((s) => s.setFixHint);
  const setActiveTab = useBlueprintStore((s) => s.setActiveTab);

  if (!isOpen) return null;

  const incompleteNodes = nodes.filter((n) => n.data.effectiveStatus === 'incomplete');
  const blockedNodes = nodes.filter((n) => n.data.effectiveStatus === 'blocked');
  const completeCount = nodes.filter((n) => n.data.effectiveStatus === 'complete').length;

  const handleFocusNode = (nodeId: string, field?: string) => {
    selectNode(nodeId);
    setActiveTab('config');
    if (field) {
      setFixHint({ nodeId, field });
    }
  };

  return (
    <div className="absolute top-10 right-80 bottom-0 w-80 bg-[#111111] border-l border-[#232323] shadow-2xl z-30 flex flex-col">
      {/* Header */}
      <div className="h-10 px-3 border-b border-[#232323] flex items-center justify-between bg-[#161616]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#FACC15]" />
          <h3 className="text-xs font-semibold text-[#FAFAFA]">Blueprint Health</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#8A8A8A]" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Summary Counts */}
      <div className="p-3 border-b border-[#232323] grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded bg-[#0A0A0A] border border-[#232323]">
          <div className="font-mono text-sm font-semibold text-[#22C55E]">{completeCount}</div>
          <div className="text-[10px] text-[#8A8A8A]">Complete</div>
        </div>
        <div className="p-2 rounded bg-[#0A0A0A] border border-[#232323]">
          <div className="font-mono text-sm font-semibold text-[#FACC15]">{incompleteNodes.length}</div>
          <div className="text-[10px] text-[#8A8A8A]">Incomplete</div>
        </div>
        <div className="p-2 rounded bg-[#0A0A0A] border border-[#232323]">
          <div className="font-mono text-sm font-semibold text-[#8A8A8A]">{blockedNodes.length}</div>
          <div className="text-[10px] text-[#8A8A8A]">Blocked</div>
        </div>
      </div>

      {/* Issues List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {incompleteNodes.length === 0 && blockedNodes.length === 0 ? (
          <div className="py-8 text-center text-[#8A8A8A]">
            <CheckCircle2 className="h-8 w-8 text-[#22C55E] mx-auto mb-2" />
            <p className="text-xs font-semibold text-[#FAFAFA]">All Nodes Valid</p>
            <p className="text-[10px] font-mono mt-1">This blueprint is ready to build a schedule!</p>
          </div>
        ) : (
          <>
            {/* Incomplete items */}
            {incompleteNodes.length > 0 && (
              <div>
                <h4 className="text-[10px] font-mono uppercase text-[#FACC15] mb-1.5 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>Incomplete Nodes ({incompleteNodes.length})</span>
                </h4>
                <div className="space-y-1.5">
                  {incompleteNodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-2 rounded bg-[#161616] border border-[#232323] text-xs hover:border-[#FACC15]/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-[#FAFAFA] truncate max-w-[150px]">
                          {node.data.label}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 px-1.5 text-[10px] text-[#FACC15] hover:text-[#FAFAFA] gap-1"
                          onClick={() => handleFocusNode(node.id, node.data.missing[0]?.field)}
                        >
                          <span>Go fix</span>
                          <ArrowRight className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                      <div className="space-y-0.5">
                        {node.data.missing.map((m, idx) => (
                          <div key={idx} className="text-[10px] font-mono text-[#8A8A8A]">
                            • {m.field}: {m.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blocked items */}
            {blockedNodes.length > 0 && (
              <div>
                <h4 className="text-[10px] font-mono uppercase text-[#8A8A8A] mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Blocked Nodes ({blockedNodes.length})</span>
                </h4>
                <div className="space-y-1.5">
                  {blockedNodes.map((node) => (
                    <div
                      key={node.id}
                      className="p-2 rounded bg-[#161616] border border-[#232323] text-xs opacity-75"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#FAFAFA] truncate">{node.data.label}</span>
                        <Badge variant="neutral" className="text-[9px] text-[#8A8A8A]">
                          Parent incomplete
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
