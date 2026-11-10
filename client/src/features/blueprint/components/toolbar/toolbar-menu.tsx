// React component for toolbar-menu.
'use client';

import { useState, useRef, useEffect } from 'react';
import {
  MoreHorizontal,
  Map,
  EyeOff,
  Maximize2,
  Lock,
  Unlock,
  PlusSquare,
  Copy,
  ClipboardPaste,
  CopyCheck,
  History,
  Camera,
  Download,
  Upload,
  BookmarkPlus,
  Layout,
  MessageSquare,
  SendHorizontal,
  Keyboard,
} from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

export interface ToolbarMenuProps {
  onCopy?: (() => void) | undefined;
  onPaste?: (() => void) | undefined;
  onDuplicate?: (() => void) | undefined;
}

/** React component rendering More menu dropdown for floating toolbar */
export function ToolbarMenu({ onCopy, onPaste, onDuplicate }: ToolbarMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isMinimapOpen = useBlueprintStore((s) => s.isMinimapOpen);
  const toggleMinimap = useBlueprintStore((s) => s.toggleMinimap);
  const hideUnrelated = useBlueprintStore((s) => s.hideUnrelated);
  const setHideUnrelated = useBlueprintStore((s) => s.setHideUnrelated);
  const isCanvasLocked = useBlueprintStore((s) => s.isCanvasLocked);
  const setIsCanvasLocked = useBlueprintStore((s) => s.setIsCanvasLocked);
  const isFullscreen = useBlueprintStore((s) => s.isFullscreen);
  const setIsFullscreen = useBlueprintStore((s) => s.setIsFullscreen);

  const setIsBulkAddOpen = useBlueprintStore((s) => s.setIsBulkAddOpen);
  const setIsHistoryOpen = useBlueprintStore((s) => s.setIsHistoryOpen);
  const setIsSnapshotsOpen = useBlueprintStore((s) => s.setIsSnapshotsOpen);
  const setIsExportOpen = useBlueprintStore((s) => s.setIsExportOpen);
  const setIsImportOpen = useBlueprintStore((s) => s.setIsImportOpen);
  const setIsSaveTemplateOpen = useBlueprintStore((s) => s.setIsSaveTemplateOpen);
  const setIsTemplatesOpen = useBlueprintStore((s) => s.setIsTemplatesOpen);
  const setIsShortcutsOpen = useBlueprintStore((s) => s.setIsShortcutsOpen);
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const setActiveCommentsNodeId = useBlueprintStore((s) => s.setActiveCommentsNodeId);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
    setIsOpen(false);
  };

  const handleRequestApproval = () => {
    toast.success(
      'Approval requested',
      'Blueprint has been submitted for administrative review.',
    );
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="More options"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'h-7 px-2 rounded-[8px] text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
          isOpen && 'text-[#FAFAFA] bg-[#1A1A1A]',
        )}
      >
        <MoreHorizontal className="h-4 w-4" />
        <span className="hidden sm:inline">More</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label="More actions"
          className="absolute bottom-11 right-0 w-60 max-h-[460px] overflow-y-auto bg-[#111111] border border-[#232323] rounded-[12px] shadow-2xl py-1 z-50 text-left text-xs divide-y divide-[#1C1C1C]"
        >
          {/* Group 1: View */}
          <div className="p-1">
            <div className="px-2.5 py-1 text-[10px] font-mono text-[#8A8A8A] uppercase tracking-wider">
              View
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                toggleMinimap();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Map className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <span>Minimap</span>
              </div>
              <span className="font-mono text-[10px] text-[#8A8A8A]">
                {isMinimapOpen ? 'On' : 'Off'}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setHideUnrelated(!hideUnrelated);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="flex items-center gap-2">
                <EyeOff className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <span>Dim Inactive</span>
              </div>
              <span className="font-mono text-[10px] text-[#8A8A8A]">
                {hideUnrelated ? 'On' : 'Off'}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleToggleFullscreen}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Maximize2 className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <span>Fullscreen</span>
              </div>
              <span className="font-mono text-[10px] text-[#8A8A8A]">
                {isFullscreen ? 'Exit' : 'Enter'}
              </span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsCanvasLocked(!isCanvasLocked);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCanvasLocked ? (
                  <Unlock className="h-3.5 w-3.5 text-[#8A8A8A]" />
                ) : (
                  <Lock className="h-3.5 w-3.5 text-[#8A8A8A]" />
                )}
                <span>{isCanvasLocked ? 'Unlock Canvas' : 'Lock Canvas'}</span>
              </div>
            </button>
          </div>

          {/* Group 2: Edit */}
          <div className="p-1">
            <div className="px-2.5 py-1 text-[10px] font-mono text-[#8A8A8A] uppercase tracking-wider">
              Edit
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsBulkAddOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <PlusSquare className="h-3.5 w-3.5 text-[#8A8A8A]" />
              <span>Bulk Add Children...</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onCopy?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Copy className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <span>Copy Subtree</span>
              </div>
              <span className="font-mono text-[10px] text-[#8A8A8A]">⌘C</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onPaste?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="flex items-center gap-2">
                <ClipboardPaste className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <span>Paste</span>
              </div>
              <span className="font-mono text-[10px] text-[#8A8A8A]">⌘V</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onDuplicate?.();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="flex items-center gap-2">
                <CopyCheck className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <span>Duplicate</span>
              </div>
              <span className="font-mono text-[10px] text-[#8A8A8A]">⌘D</span>
            </button>
          </div>

          {/* Group 3: History */}
          <div className="p-1">
            <div className="px-2.5 py-1 text-[10px] font-mono text-[#8A8A8A] uppercase tracking-wider">
              History
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsHistoryOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <History className="h-3.5 w-3.5 text-[#8A8A8A]" />
              <span>Revision History</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsSnapshotsOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <Camera className="h-3.5 w-3.5 text-[#8A8A8A]" />
              <span>Snapshots</span>
            </button>
          </div>

          {/* Group 4: Data */}
          <div className="p-1">
            <div className="px-2.5 py-1 text-[10px] font-mono text-[#8A8A8A] uppercase tracking-wider">
              Data & Templates
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsExportOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-[#8A8A8A]" />
              <span>Export (JSON, SVG, PNG)</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsImportOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <Upload className="h-3.5 w-3.5 text-[#8A8A8A]" />
              <span>Import Graph...</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsSaveTemplateOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <BookmarkPlus className="h-3.5 w-3.5 text-[#8A8A8A]" />
              <span>Save as Template...</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsTemplatesOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <Layout className="h-3.5 w-3.5 text-[#8A8A8A]" />
              <span>Starter Kits & Templates</span>
            </button>
          </div>

          {/* Group 5: Collaboration */}
          <div className="p-1">
            <div className="px-2.5 py-1 text-[10px] font-mono text-[#8A8A8A] uppercase tracking-wider">
              Collaboration
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                if (selectedNodeId) {
                  setActiveCommentsNodeId(selectedNodeId);
                } else {
                  toast.info('Select a node', 'Select a node to inspect or add comments.');
                }
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5 text-[#8A8A8A]" />
              <span>Node Comments</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={handleRequestApproval}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <SendHorizontal className="h-3.5 w-3.5 text-[#8A8A8A]" />
              <span>Submit for Approval</span>
            </button>
          </div>

          {/* Group 6: Help */}
          <div className="p-1">
            <div className="px-2.5 py-1 text-[10px] font-mono text-[#8A8A8A] uppercase tracking-wider">
              Help
            </div>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsShortcutsOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Keyboard className="h-3.5 w-3.5 text-[#8A8A8A]" />
                <span>Shortcuts</span>
              </div>
              <span className="font-mono text-[10px] text-[#8A8A8A]">?</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
