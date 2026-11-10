// React component for compact node-issues-card.
'use client';

import { useEffect, useRef, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Wrench, Sliders } from 'lucide-react';
import { groupAndSortIssues } from './issue-label';
import { getSafeDefaultsForNodeType } from './safe-defaults';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import { cn } from '@/lib/utils';

export interface NodeIssuesCardProps {
  node: BlueprintCanvasNode | null;
  anchorRect: DOMRect | null;
  isOpen: boolean;
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const CARD_WIDTH = 256;
const GAP = 12;

function subscribeClient() {
  return () => {};
}

/** React component rendering compact hover & focus card for node errors and requirements */
export function NodeIssuesCard({
  node,
  anchorRect,
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}: NodeIssuesCardProps) {
  const isClient = useSyncExternalStore(
    subscribeClient,
    () => true,
    () => false,
  );
  const cardRef = useRef<HTMLDivElement>(null);

  const selectNode = useBlueprintStore((s) => s.selectNode);
  const setActiveTab = useBlueprintStore((s) => s.setActiveTab);
  const updateNodeData = useBlueprintStore((s) => s.updateNodeData);

  // Compute issues
  const { errors, warnings, all, totalCount } = useMemo(() => {
    if (!node) return { errors: [], warnings: [], all: [], totalCount: 0 };
    return groupAndSortIssues(node);
  }, [node]);

  // Handle Escape key to close card and return focus to node
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        if (node?.id) {
          const nodeEl = document.querySelector<HTMLElement>(`[data-testid="blueprint-node-${node.id}"]`);
          nodeEl?.focus();
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, node?.id]);

  if (!isClient || !isOpen || !node || !anchorRect || totalCount === 0) {
    return null;
  }

  // Safe canvas area (avoiding 360px right config sidebar and 72px left palette)
  const safeLeft = 72;
  const safeRight = Math.max(window.innerWidth - 360, CARD_WIDTH + 80);
  const safeTop = 56;
  const safeBottom = Math.max(window.innerHeight - 60, 300);

  // Preferred order: right of node, left of node, below node
  let left = anchorRect.right + GAP;
  let top = anchorRect.top;
  let placement: 'right' | 'left' | 'bottom' = 'right';

  if (left + CARD_WIDTH > safeRight) {
    // Try left of node
    if (anchorRect.left - GAP - CARD_WIDTH >= safeLeft) {
      left = anchorRect.left - GAP - CARD_WIDTH;
      placement = 'left';
    } else {
      // Fallback: below node
      left = Math.max(safeLeft, Math.min(safeRight - CARD_WIDTH, anchorRect.left));
      top = anchorRect.bottom + GAP;
      placement = 'bottom';
    }
  }

  // Clamp vertical bounds
  top = Math.max(safeTop, Math.min(safeBottom - 260, top));

  const isLocked = Boolean(node.data.locked);
  const canAutoFix = !isLocked && (node.data.missing?.length || 0) > 0;

  const handleFixAutomatically = () => {
    if (!canAutoFix) return;
    const safeDefaults = getSafeDefaultsForNodeType(node.data.nodeType || 'institution', node.data.config);
    const mergedConfig = { ...(node.data.config || {}), ...safeDefaults };
    updateNodeData(node.id, { config: mergedConfig });

    window.dispatchEvent(
      new CustomEvent('slotly:auto-fix-node', {
        detail: { nodeId: node.id, safeDefaults },
      }),
    );

    toast.success('Fields auto-configured', 'Applied safe defaults to node.');
    onClose();
  };

  const handleOpenInConfig = () => {
    selectNode(node.id);
    setActiveTab('config');
    onClose();
  };

  const headerId = `node-issues-header-${node.id}`;
  const showGroupLabels = errors.length > 0 && warnings.length > 0;
  const moreCount = Math.max(0, all.length - 4);

  return createPortal(
    <div
      ref={cardRef}
      role="group"
      aria-labelledby={headerId}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid="node-issues-card"
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${CARD_WIDTH}px`,
      }}
      className={cn(
        'z-40 rounded-[12px] border border-[#232323] bg-[#111111] p-3 shadow-xl select-none',
        'animate-in fade-in-0 duration-100 motion-reduce:duration-0',
      )}
    >
      {/* Visual Caret (6px) pointing to anchor node */}
      {placement === 'right' && (
        <div
          aria-hidden="true"
          className="absolute -left-[5px] top-4 w-2.5 h-2.5 bg-[#111111] border-l border-b border-[#232323] rotate-45"
        />
      )}
      {placement === 'left' && (
        <div
          aria-hidden="true"
          className="absolute -right-[5px] top-4 w-2.5 h-2.5 bg-[#111111] border-r border-t border-[#232323] rotate-45"
        />
      )}
      {placement === 'bottom' && (
        <div
          aria-hidden="true"
          className="absolute -top-[5px] left-6 w-2.5 h-2.5 bg-[#111111] border-l border-t border-[#232323] rotate-45"
        />
      )}

      {/* Header: Node Name + Issue Count on ONE line. No close button. */}
      <div
        id={headerId}
        className="flex items-center justify-between gap-2 pb-2 border-b border-[#232323]"
      >
        <span className="truncate text-[#FAFAFA] font-medium text-[13px]">
          {node.data.label || 'Untitled Node'}
        </span>
        <span className="font-mono text-[12px] text-[#8A8A8A] shrink-0">
          {totalCount} {totalCount === 1 ? 'issue' : 'issues'}
        </span>
      </div>

      {/* Issues List (Max 4 items visible, scrollable up to ~200px) */}
      <div className="mt-2.5 max-h-[200px] overflow-y-auto space-y-1.5 [scrollbar-width:thin] pr-1">
        {/* Errors (Blocking) */}
        {errors.length > 0 && (
          <div className="space-y-1.5">
            {showGroupLabels && (
              <div className="text-[12px] font-mono text-[#8A8A8A]">
                Errors ({errors.length})
              </div>
            )}
            {errors.map((item) => (
              <div
                key={item.id}
                className="py-2 px-2.5 rounded-[6px] border-l-2 border-[#EF4444] bg-[#141414] border border-[#232323]"
              >
                <div className="text-[12px] text-[#FAFAFA] font-medium leading-snug">
                  {item.message}
                </div>
                <div className="text-[12px] font-mono text-[#8A8A8A] mt-0.5 truncate">
                  {item.rawKey}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Warnings / Missing requirements */}
        {warnings.length > 0 && (
          <div className="space-y-1.5">
            {showGroupLabels && (
              <div className="text-[12px] font-mono text-[#8A8A8A] pt-1">
                Requirements ({warnings.length})
              </div>
            )}
            {warnings.map((item) => (
              <div
                key={item.id}
                className="py-2 px-2.5 rounded-[6px] border-l-2 border-[#FACC15] bg-[#141414] border border-[#232323]"
              >
                <div className="text-[12px] text-[#FAFAFA] font-medium leading-snug">
                  {item.message}
                </div>
                <div className="text-[12px] font-mono text-[#8A8A8A] mt-0.5 truncate">
                  {item.rawKey}
                </div>
              </div>
            ))}
          </div>
        )}

        {moreCount > 0 && (
          <div className="text-[12px] font-mono text-center text-[#8A8A8A] pt-1">
            +{moreCount} more
          </div>
        )}
      </div>

      {/* Actions Row: Two 28px outline buttons */}
      <div className="mt-2.5 pt-2.5 border-t border-[#232323] flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={!canAutoFix}
          title={!canAutoFix ? (isLocked ? 'Node is locked' : 'No missing fields to fix') : undefined}
          onClick={handleFixAutomatically}
          className={cn(
            'h-7 px-2.5 rounded-[8px] border text-[12px] font-medium flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
            canAutoFix
              ? 'border-[#383838] bg-[#161616] text-[#FAFAFA] hover:bg-[#202020]'
              : 'border-[#1C1C1C] bg-[#111111] text-[#666666] cursor-not-allowed opacity-50',
          )}
        >
          <Wrench className="h-3 w-3" />
          <span>Fix automatically</span>
        </button>

        <button
          type="button"
          onClick={handleOpenInConfig}
          className="h-7 px-2.5 rounded-[8px] border border-[#383838] bg-[#161616] hover:bg-[#202020] text-[#FAFAFA] text-[12px] font-medium flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Sliders className="h-3 w-3" />
          <span>Open in config</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}
