// Header component for the blueprint sidebar with ancestor breadcrumbs, status, save indicator, presence, and action menu.
'use client';

import * as React from 'react';
import {
  MoreHorizontal,
  Copy,
  Lock,
  Unlock,
  MessageSquare,
  Trash2,
  CopyCheck,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { TYPE_ICONS } from '../canvas/node-card';
import { useBlueprintStore } from '../../store/blueprint.store';
import type { BlueprintCanvasNode, AutosaveStatus } from '../../types/canvas.types';
import { cn } from '@/lib/utils';

/** Props for SidebarHeader component. */
export interface SidebarHeaderProps {
  node: BlueprintCanvasNode;
  autosaveStatus: AutosaveStatus;
  requiredCompletedCount: number;
  totalRequiredCount: number;
  onOpenCopySettings: () => void;
  onDuplicateNode?: () => void;
  onToggleLock?: () => void;
  isReadOnly?: boolean | undefined;
  className?: string | undefined;
}

/** React component rendering rich sidebar header with status indicators and action menu. */
export function SidebarHeader({
  node,
  autosaveStatus,
  requiredCompletedCount,
  totalRequiredCount,
  onOpenCopySettings,
  onDuplicateNode,
  onToggleLock,
  isReadOnly = false,
  className = '',
}: SidebarHeaderProps) {
  const nodes = useBlueprintStore((s) => s.nodes);
  const selectNode = useBlueprintStore((s) => s.selectNode);
  const setActiveCommentsNodeId = useBlueprintStore((s) => s.setActiveCommentsNodeId);
  const setImpactPreviewNode = useBlueprintStore((s) => s.setImpactPreviewNode);
  const presenceUsers = useBlueprintStore((s) => s.presenceUsers);

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Compute clickable ancestor breadcrumbs
  const ancestors = React.useMemo(() => {
    const trail: BlueprintCanvasNode[] = [];
    let currentParentId = node.data.parentId;

    while (currentParentId) {
      const parent = nodes.find((n) => n.id === currentParentId);
      if (!parent) break;
      trail.unshift(parent);
      currentParentId = parent.data.parentId;
    }
    return trail;
  }, [node.data.parentId, nodes]);

  // Close menu on click outside
  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  const Icon = TYPE_ICONS[node.data.nodeType] || AlertTriangle;
  const isComplete = node.data.effectiveStatus === 'complete';
  const isLocked = Boolean(node.data.locked);
  const lockedByOther = node.data.lockedBy && node.data.lockedBy.userName;

  // Active users viewing this node
  const activeViewers = React.useMemo(() => {
    return presenceUsers.slice(0, 3);
  }, [presenceUsers]);

  return (
    <div className={cn('p-3.5 border-b border-[#232323] bg-[#0A0A0A] space-y-2.5 select-none shrink-0', className)}>
      {/* Ancestor Breadcrumbs */}
      {ancestors.length > 0 && (
        <nav aria-label="Hierarchy Breadcrumbs" className="flex items-center gap-1 text-[11px] font-mono text-[#8A8A8A] overflow-hidden whitespace-nowrap">
          {ancestors.map((anc) => (
            <React.Fragment key={anc.id}>
              <button
                type="button"
                onClick={() => selectNode(anc.id)}
                className="hover:text-[#FAFAFA] transition-colors truncate max-w-[90px]"
                title={`Select ${anc.data.label}`}
              >
                {anc.data.label}
              </button>
              <ChevronRight className="h-3 w-3 shrink-0 text-[#444444]" />
            </React.Fragment>
          ))}
          <span className="text-[#FAFAFA] truncate max-w-[100px] font-medium">
            {node.data.label}
          </span>
        </nav>
      )}

      {/* Main Header Row */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="h-8 w-8 rounded-[8px] bg-[#141414] border border-[#232323] text-[#FAFAFA] flex items-center justify-center shrink-0 mt-0.5">
            <Icon className="h-4 w-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-[#FAFAFA] truncate max-w-[190px]" title={node.data.label}>
                {node.data.label}
              </h2>
              <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#181818] text-[#8A8A8A] border border-[#282828] uppercase shrink-0">
                {node.data.nodeType}
              </span>
            </div>

            {/* Status & Required Counts */}
            <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
              <div className="flex items-center gap-1">
                {isComplete ? (
                  <span className="inline-flex items-center gap-1 text-[#22C55E]">
                    <CheckCircle className="h-3 w-3" />
                    <span>Complete</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[#FACC15]">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Incomplete</span>
                  </span>
                )}
              </div>
              <span className="text-[#333333]">•</span>
              <span className="text-[#8A8A8A]">
                {requiredCompletedCount}/{totalRequiredCount} required
              </span>
            </div>
          </div>
        </div>

        {/* Presence, Save Status, & Action Menu */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Presence Avatars */}
          {activeViewers.length > 0 && (
            <div className="flex -space-x-1.5 mr-1" title="Users in project">
              {activeViewers.map((u, i) => (
                <div
                  key={u.userId || i}
                  className="h-5 w-5 rounded-full border border-black bg-[#282828] text-[9px] font-mono text-[#FAFAFA] flex items-center justify-center shrink-0"
                  title={u.name}
                >
                  {u.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              ))}
            </div>
          )}

          {/* Autosave Status Badge with polite live region */}
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-1 font-mono text-[10px] text-[#8A8A8A] px-1.5 py-0.5 rounded bg-[#121212] border border-[#202020]"
          >
            {autosaveStatus === 'saving' ? (
              <>
                <Loader2 className="h-2.5 w-2.5 animate-spin text-[#FACC15]" />
                <span className="text-[#FACC15]">Saving...</span>
              </>
            ) : autosaveStatus === 'offline' ? (
              <span className="text-[#8A8A8A]">Offline</span>
            ) : (
              <>
                <CheckCircle className="h-2.5 w-2.5 text-[#22C55E]" />
                <span>Saved</span>
              </>
            )}
          </div>

          {/* Action Menu */}
          {!isReadOnly && (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Node actions"
                className="h-7 w-7 rounded-[6px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#181818] border border-transparent hover:border-[#282828] flex items-center justify-center transition-colors"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 w-44 rounded-[8px] bg-[#141414] border border-[#2B2B2B] shadow-2xl p-1 text-xs font-mono space-y-0.5 animate-in fade-in-0 zoom-in-95">
                  {onDuplicateNode && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onDuplicateNode();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-[#202020] text-[#FAFAFA] flex items-center gap-2"
                    >
                      <Copy className="h-3.5 w-3.5 text-[#8A8A8A]" />
                      <span>Duplicate Node</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenCopySettings();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#202020] text-[#FAFAFA] flex items-center gap-2"
                  >
                    <CopyCheck className="h-3.5 w-3.5 text-[#8A8A8A]" />
                    <span>Copy Settings...</span>
                  </button>

                  {onToggleLock && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onToggleLock();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded hover:bg-[#202020] text-[#FAFAFA] flex items-center gap-2"
                    >
                      {isLocked ? (
                        <>
                          <Unlock className="h-3.5 w-3.5 text-[#8A8A8A]" />
                          <span>Unlock Node</span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-3.5 w-3.5 text-[#8A8A8A]" />
                          <span>Lock Node</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setActiveCommentsNodeId(node.id);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#202020] text-[#FAFAFA] flex items-center gap-2"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-[#8A8A8A]" />
                    <span>Comments</span>
                  </button>

                  <div className="h-px bg-[#232323] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setImpactPreviewNode(node);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-[#2A1414] text-[#EF4444] flex items-center gap-2"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Node...</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Locked by another user banner */}
      {lockedByOther && (
        <div className="p-2 rounded-[8px] bg-[#1F1414] border border-[#3E2222] flex items-center gap-2 text-xs text-[#EF4444]">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span>Locked by {node.data.lockedBy?.userName}. Form is read-only.</span>
        </div>
      )}
    </div>
  );
}
