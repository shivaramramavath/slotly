// React component for blueprint-context-menu.
'use client';

import { useEffect, useRef } from 'react';
import {
  Copy,
  ClipboardPaste,
  CopyPlus,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Focus,
  Plus,
  BookmarkPlus,
  MessageSquare,
} from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useGateValidation } from '../../hooks/use-gate-validation';
import { toast } from '@/components/ui/toast';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { BlueprintNodeType } from '@slotly/contracts';

interface BlueprintContextMenuProps {
  onAddChild: (parentId: string, type: BlueprintNodeType) => void;
  onDuplicate: (node: BlueprintCanvasNode) => void;
  onCopy: (node: BlueprintCanvasNode) => void;
  onPaste: (targetParentId?: string) => void;
}

/** React component rendering blueprint context menu. */
export function BlueprintContextMenu({
  onAddChild,
  onDuplicate,
  onCopy,
  onPaste,
}: BlueprintContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const contextMenu = useBlueprintStore((s) => s.contextMenu);
  const setContextMenu = useBlueprintStore((s) => s.setContextMenu);
  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const clipboard = useBlueprintStore((s) => s.clipboard);
  const setImpactPreviewNode = useBlueprintStore((s) => s.setImpactPreviewNode);
  const toggleNodeLock = useBlueprintStore((s) => s.toggleNodeLock);
  const toggleNodeHidden = useBlueprintStore((s) => s.toggleNodeHidden);
  const focusModeNodeId = useBlueprintStore((s) => s.focusModeNodeId);
  const setFocusModeNodeId = useBlueprintStore((s) => s.setFocusModeNodeId);
  const setIsSaveTemplateOpen = useBlueprintStore((s) => s.setIsSaveTemplateOpen);
  const setActiveCommentsNodeId = useBlueprintStore((s) => s.setActiveCommentsNodeId);

  const targetNode = nodes.find((n) => n.id === contextMenu?.nodeId);
  const { getAllowedChildTypes } = useGateValidation(nodes, edges);

  // Close context menu on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setContextMenu]);

  if (!contextMenu) return null;

  const allowedChildren = targetNode ? getAllowedChildTypes(targetNode.data.nodeType) : [];
  const isTargetComplete = targetNode?.data.effectiveStatus === 'complete';
  const isLocked = Boolean(targetNode?.data.locked);
  const isHidden = Boolean(targetNode?.data.hidden);
  const isFocusTarget = focusModeNodeId === targetNode?.id;

  return (
    <div
      ref={menuRef}
      style={{ left: contextMenu.x, top: contextMenu.y }}
      className="fixed z-50 min-w-[200px] bg-[#111111] border border-[#232323] rounded-md shadow-2xl py-1 text-xs text-[#FAFAFA] animate-in fade-in-0 zoom-in-95"
      onClick={(e) => e.stopPropagation()}
    >
      {targetNode && (
        <>
          <div className="px-3 py-1.5 border-b border-[#232323] font-mono text-[10px] text-[#8A8A8A] flex items-center justify-between">
            <span className="uppercase">{targetNode.data.nodeType}</span>
            <span className="truncate max-w-[100px]">{targetNode.data.label}</span>
          </div>

          {/* Copy */}
          <button
            type="button"
            onClick={() => {
              onCopy(targetNode);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1f1f1f] flex items-center gap-2 text-left"
          >
            <Copy className="h-3.5 w-3.5 text-[#8A8A8A]" />
            <span>Copy Subtree</span>
            <span className="ml-auto font-mono text-[9px] text-[#8A8A8A]">Ctrl+C</span>
          </button>

          {/* Duplicate Subtree */}
          <button
            type="button"
            onClick={() => {
              onDuplicate(targetNode);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1f1f1f] flex items-center gap-2 text-left"
          >
            <CopyPlus className="h-3.5 w-3.5 text-[#8A8A8A]" />
            <span>Duplicate Subtree</span>
            <span className="ml-auto font-mono text-[9px] text-[#8A8A8A]">Ctrl+D</span>
          </button>
        </>
      )}

      {/* Paste */}
      <button
        type="button"
        disabled={!clipboard}
        onClick={() => {
          onPaste(targetNode?.id);
          setContextMenu(null);
        }}
        className="w-full px-3 py-1.5 hover:bg-[#1f1f1f] flex items-center gap-2 text-left disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ClipboardPaste className="h-3.5 w-3.5 text-[#8A8A8A]" />
        <span>Paste Here</span>
        <span className="ml-auto font-mono text-[9px] text-[#8A8A8A]">Ctrl+V</span>
      </button>

      {targetNode && (
        <>
          <div className="h-px bg-[#232323] my-1" />

          {/* Lock / Unlock */}
          <button
            type="button"
            onClick={() => {
              toggleNodeLock(targetNode.id);
              setContextMenu(null);
              toast.info(isLocked ? 'Node unlocked' : 'Node locked', targetNode.data.label);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1f1f1f] flex items-center gap-2 text-left"
          >
            {isLocked ? (
              <>
                <Unlock className="h-3.5 w-3.5 text-[#22C55E]" />
                <span>Unlock Node</span>
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 text-[#FACC15]" />
                <span>Lock Node</span>
              </>
            )}
            <span className="ml-auto font-mono text-[9px] text-[#8A8A8A]">L</span>
          </button>

          {/* Hide / Show */}
          <button
            type="button"
            onClick={() => {
              toggleNodeHidden(targetNode.id);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1f1f1f] flex items-center gap-2 text-left"
          >
            {isHidden ? (
              <>
                <Eye className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <span>Show Node</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <span>Hide Node</span>
              </>
            )}
            <span className="ml-auto font-mono text-[9px] text-[#8A8A8A]">H</span>
          </button>

          {/* Focus Mode */}
          <button
            type="button"
            onClick={() => {
              setFocusModeNodeId(isFocusTarget ? null : targetNode.id);
              setContextMenu(null);
              toast.info(isFocusTarget ? 'Focus mode exited' : `Focusing ${targetNode.data.label}`);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1f1f1f] flex items-center gap-2 text-left"
          >
            <Focus className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>{isFocusTarget ? 'Exit Focus Mode' : 'Focus Mode'}</span>
            <span className="ml-auto font-mono text-[9px] text-[#8A8A8A]">F</span>
          </button>

          {/* Node Comments */}
          <button
            type="button"
            onClick={() => {
              setActiveCommentsNodeId(targetNode.id);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1f1f1f] flex items-center gap-2 text-left"
          >
            <MessageSquare className="h-3.5 w-3.5 text-[#8A8A8A]" />
            <span>Comments</span>
          </button>

          {/* Save as Template */}
          <button
            type="button"
            onClick={() => {
              setIsSaveTemplateOpen(true);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#1f1f1f] flex items-center gap-2 text-left"
          >
            <BookmarkPlus className="h-3.5 w-3.5 text-[#FACC15]" />
            <span>Save Subtree as Template</span>
          </button>

          {/* Add Child Menu if complete */}
          {isTargetComplete && allowedChildren.length > 0 && (
            <>
              <div className="h-px bg-[#232323] my-1" />
              <div className="px-3 py-1 text-[10px] font-mono text-[#8A8A8A]">Add Child:</div>
              {allowedChildren.map((childType) => (
                <button
                  key={childType}
                  type="button"
                  onClick={() => {
                    onAddChild(targetNode.id, childType);
                    setContextMenu(null);
                  }}
                  className="w-full px-3 py-1.5 hover:bg-[#1f1f1f] flex items-center gap-2 text-left capitalize"
                >
                  <Plus className="h-3.5 w-3.5 text-[#22C55E]" />
                  <span>{childType}</span>
                </button>
              ))}
            </>
          )}

          <div className="h-px bg-[#232323] my-1" />

          {/* Delete with Impact Preview */}
          <button
            type="button"
            onClick={() => {
              setImpactPreviewNode(targetNode);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 hover:bg-[#EF4444]/10 text-[#EF4444] flex items-center gap-2 text-left"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete with Impact Preview</span>
            <span className="ml-auto font-mono text-[9px] text-[#EF4444]/70">Del</span>
          </button>
        </>
      )}
    </div>
  );
}
