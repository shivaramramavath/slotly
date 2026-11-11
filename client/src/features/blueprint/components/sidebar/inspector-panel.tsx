// Inspector sidebar panel providing docked, drawer, and bottom sheet modes with tab navigation, resizing, and headers.
'use client';

import * as React from 'react';
import {
  PanelRightClose,
  PanelRightOpen,
  RotateCcw,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlueprintStore } from '../../store/blueprint.store';
import { BlueprintOverview } from './blueprint-overview';
import { SidebarHeader } from './sidebar-header';
import { NodeConfigForm } from './node-config-form';
import { NodeCheckTab } from './tabs/node-check-tab';
import { BulkPanel } from './bulk-panel';
import { CopySettingsDialog } from '../dialogs/copy-settings-dialog';
import { AiChatPanel } from './ai-chat-panel';
import { blueprintApi } from '../../services/blueprint.api';
import type { SidebarTab } from '../../types/canvas.types';
import type { BlueprintRecommendationDto } from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Props for InspectorPanel component. */
export interface InspectorPanelProps {
  projectId: string;
  onUpdateConfig: (nodeId: string, data: Record<string, unknown>) => void;
  className?: string | undefined;
}

const TABS: Array<{ value: SidebarTab; label: string }> = [
  { value: 'node', label: 'Node' },
  { value: 'check', label: 'Check' },
  { value: 'ai', label: 'AI' },
];

/** React component rendering responsive inspector sidebar with collapsible state. */
export function InspectorPanel({
  projectId,
  onUpdateConfig,
  className = '',
}: InspectorPanelProps) {
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const selectedNodeIds = useBlueprintStore((s) => s.selectedNodeIds);
  const nodes = useBlueprintStore((s) => s.nodes);
  const activeTab = useBlueprintStore((s) => s.activeTab);
  const setActiveTab = useBlueprintStore((s) => s.setActiveTab);
  const autosaveStatus = useBlueprintStore((s) => s.autosaveStatus);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Local storage collapse state
  const [isCollapsed, setIsCollapsed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem('slotly:inspector:collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Local storage width state (320 to 480 px, default 360 px)
  const [panelWidth, setPanelWidth] = React.useState<number>(() => {
    try {
      const stored = localStorage.getItem('slotly:blueprint:inspector-width');
      if (stored) {
        const num = parseInt(stored, 10);
        if (!isNaN(num) && num >= 320 && num <= 480) return num;
      }
    } catch {
      // fallback
    }
    return 360;
  });

  const [isCopySettingsOpen, setIsCopySettingsOpen] = React.useState(false);
  const [recommendations, setRecommendations] = React.useState<BlueprintRecommendationDto[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Responsive mode detection: desktop (>= 1024px), tablet drawer (768-1023px), mobile sheet (< 768px)
  const [viewportWidth, setViewportWidth] = React.useState<number>(1440);
  const [mobileSnap, setMobileSnap] = React.useState<'half' | 'full'>('half');

  React.useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isTablet = viewportWidth >= 768 && viewportWidth < 1024;
  const isMobile = viewportWidth < 768;

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('slotly:inspector:collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Resize handling via left drag border
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = startX - moveEvent.clientX;
      const nextWidth = Math.min(480, Math.max(320, startWidth + deltaX));
      setPanelWidth(nextWidth);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      try {
        localStorage.setItem('slotly:blueprint:inspector-width', String(panelWidth));
      } catch {
        // ignore
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Fetch recommendations for selected node
  const fetchRecommendations = React.useCallback(async () => {
    if (!selectedNodeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const recs = await blueprintApi.getRecommendations(projectId, selectedNodeId);
      setRecommendations(recs || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  }, [projectId, selectedNodeId]);

  React.useEffect(() => {
    if (!selectedNodeId) return;
    let mounted = true;
    void blueprintApi
      .getRecommendations(projectId, selectedNodeId)
      .then((recs) => {
        if (mounted) setRecommendations(recs || []);
      })
      .catch((err) => {
        if (mounted) setError((err as Error).message || 'Failed to load recommendations');
      });

    return () => {
      mounted = false;
    };
  }, [projectId, selectedNodeId]);

  // Loading skeleton state after 150ms
  const [showSkeleton, setShowSkeleton] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkeleton(isLoading);
    }, isLoading ? 150 : 0);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Compute canonical active tab
  const currentTab: SidebarTab =
    activeTab === 'config' ? 'node' : activeTab === 'constraints' ? 'node' : activeTab;

  // Compute required counts for header
  const requiredCompletedCount = React.useMemo(() => {
    if (!selectedNode) return 0;
    const missingCount = selectedNode.data.missing?.length || 0;
    return Math.max(0, 4 - missingCount);
  }, [selectedNode]);

  // If collapsed on desktop, render 32px floating "Open inspector" trigger button
  if (isCollapsed && !isTablet && !isMobile) {
    return (
      <button
        type="button"
        onClick={toggleCollapse}
        title="Open inspector"
        aria-label="Open inspector"
        className="absolute right-3 top-3 z-20 h-8 w-8 rounded-[8px] bg-[#141414] hover:bg-[#1E1E1E] border border-[#232323] hover:border-[#383838] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center transition-colors shadow-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
      >
        <PanelRightOpen className="h-4 w-4" />
      </button>
    );
  }

  // Multi-select bulk edit view
  const isMultiSelect = selectedNodeIds.length > 1;

  const panelContent = (
    <div className="flex flex-col h-full bg-[#0A0A0A] select-none text-xs">
      {/* Top Header & Actions */}
      {isMultiSelect ? (
        <div className="h-12 px-3 border-b border-[#232323] flex items-center justify-between gap-2 shrink-0 bg-[#0A0A0A]">
          <span className="font-semibold text-xs text-[#FAFAFA]">Bulk Edit</span>
          <button
            type="button"
            onClick={toggleCollapse}
            aria-label="Collapse inspector"
            className="h-8 w-8 rounded-[8px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#181818] flex items-center justify-center transition-colors shrink-0"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>
      ) : selectedNode ? (
        <SidebarHeader
          node={selectedNode}
          autosaveStatus={autosaveStatus}
          requiredCompletedCount={requiredCompletedCount}
          totalRequiredCount={4}
          onOpenCopySettings={() => setIsCopySettingsOpen(true)}
        />
      ) : null}

      {/* Tab Row & Collapse Header */}
      {!isMultiSelect && (
        <div className="h-11 px-3 border-b border-[#232323] flex items-center justify-between gap-2 shrink-0 bg-[#0A0A0A]">
          <SegmentedControl<SidebarTab>
            options={TABS}
            value={currentTab}
            onChange={(tab) => {
              setActiveTab(tab);
              try {
                localStorage.setItem('slotly:inspector:tab', tab);
              } catch {
                // ignore
              }
            }}
            ariaLabel="Inspector sections"
            className="h-8 py-0.5"
          />

          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand inspector' : 'Collapse inspector'}
            aria-label={isCollapsed ? 'Expand inspector' : 'Collapse inspector'}
            className="h-8 w-8 rounded-[8px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#181818] border border-transparent hover:border-[#232323] flex items-center justify-center transition-colors shrink-0"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Tab View Area */}
      <div className="flex-1 overflow-y-auto relative flex flex-col">
        {isMultiSelect ? (
          <BulkPanel
            projectId={projectId}
            onUpdateNodes={async (nodeIds, patch) => {
              nodeIds.forEach((id) => onUpdateConfig(id, patch));
            }}
          />
        ) : showSkeleton ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-[10px]" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-[12px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-10 w-full rounded-[10px]" />
            <Skeleton className="h-28 w-full rounded-[12px]" />
          </div>
        ) : error ? (
          <div className="p-6 text-center space-y-3 m-auto">
            <AlertTriangle className="h-8 w-8 text-[#EF4444] mx-auto" />
            <p className="font-medium text-xs text-[#FAFAFA]">Failed to load inspector data</p>
            <p className="font-mono text-[11px] text-[#8A8A8A]">{error}</p>
            <button
              type="button"
              onClick={() => void fetchRecommendations()}
              className="h-8 px-3 rounded-[8px] bg-[#141414] hover:bg-[#1E1E1E] border border-[#232323] text-xs font-mono text-[#FAFAFA] inline-flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <>
            {currentTab === 'node' && (
              selectedNode ? (
                <NodeConfigForm
                  key={selectedNode.id}
                  node={selectedNode}
                  onUpdateConfig={onUpdateConfig}
                  recommendations={recommendations}
                />
              ) : (
                <div className="flex-1 overflow-y-auto">
                  <BlueprintOverview projectId={projectId} />
                </div>
              )
            )}

            {currentTab === 'check' && (
              selectedNode ? (
                <NodeCheckTab
                  key={selectedNode.id}
                  projectId={projectId}
                  node={selectedNode}
                />
              ) : (
                <div className="p-8 text-center text-[#8A8A8A] font-mono text-xs">
                  Select a node to review its checklist.
                </div>
              )
            )}

            {currentTab === 'ai' && (
              <AiChatPanel projectId={projectId} />
            )}
          </>
        )}
      </div>

      {/* Copy Settings Modal */}
      {selectedNode && (
        <CopySettingsDialog
          isOpen={isCopySettingsOpen}
          onClose={() => setIsCopySettingsOpen(false)}
          projectId={projectId}
          targetNodeId={selectedNode.id}
        />
      )}
    </div>
  );

  // Tablet Drawer Overlay (< 1024px, >= 768px)
  if (isTablet) {
    if (isCollapsed) {
      return (
        <button
          type="button"
          onClick={toggleCollapse}
          title="Open inspector"
          aria-label="Open inspector"
          className="fixed right-3 top-14 z-40 h-8 w-8 rounded-[8px] bg-[#141414] hover:bg-[#1E1E1E] border border-[#232323] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center shadow-2xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
        >
          <PanelRightOpen className="h-4 w-4" />
        </button>
      );
    }

    return (
      <div className="fixed inset-0 z-40 flex justify-end">
        {/* Scrim Overlay */}
        <div
          onClick={toggleCollapse}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />
        <aside
          role="dialog"
          aria-label="Blueprint Inspector"
          className="relative w-[340px] max-w-[85vw] h-full border-l border-[#232323] shadow-2xl z-50 bg-[#0A0A0A]"
        >
          {panelContent}
        </aside>
      </div>
    );
  }

  // Mobile Bottom Sheet (< 768px)
  if (isMobile) {
    if (isCollapsed) {
      return (
        <button
          type="button"
          onClick={toggleCollapse}
          title="Open inspector"
          aria-label="Open inspector"
          className="fixed right-3 bottom-16 z-40 h-8 w-8 rounded-[8px] bg-[#141414] hover:bg-[#1E1E1E] border border-[#232323] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center shadow-2xl"
        >
          <Sliders className="h-4 w-4" />
        </button>
      );
    }

    const sheetHeight = mobileSnap === 'half' ? 'h-[48vh]' : 'h-[88vh]';

    return (
      <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col justify-end pointer-events-none">
        <aside
          role="dialog"
          aria-label="Blueprint Inspector"
          className={cn(
            'pointer-events-auto w-full border-t border-[#232323] shadow-2xl bg-[#0A0A0A] rounded-t-[16px] transition-all duration-300 flex flex-col',
            sheetHeight,
          )}
        >
          {/* Drag Handle & Snap Toggles */}
          <div
            onClick={() => setMobileSnap((s) => (s === 'half' ? 'full' : 'half'))}
            className="w-full pt-2 pb-1 flex flex-col items-center justify-center cursor-pointer select-none"
          >
            <div className="w-10 h-1 rounded-full bg-[#383838]" />
          </div>

          {panelContent}
        </aside>
      </div>
    );
  }

  // Desktop Docked Sidebar (>= 1024px) with Resizing Edge
  return (
    <aside
      style={{ width: `${panelWidth}px` }}
      className={cn(
        'relative h-full border-l border-[#232323] bg-[#0A0A0A] z-20 shrink-0 transition-[width] duration-75',
        className,
      )}
    >
      {/* Left resize handle */}
      <div
        onMouseDown={handleMouseDownResize}
        title="Drag to resize inspector"
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#FAFAFA]/20 active:bg-[#FAFAFA]/40 transition-colors z-30 -translate-x-1/2"
      />

      {panelContent}
    </aside>
  );
}
