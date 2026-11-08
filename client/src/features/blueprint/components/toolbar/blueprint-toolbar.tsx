// React component for blueprint-toolbar.
'use client';

import {
  RotateCcw,
  RotateCw,
  Compass,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  WifiOff,
  RefreshCw,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowLeft,
  Lock,
  Unlock,
  Maximize,
  HelpCircle,
  History,
  Camera,
  Layers,
  Upload,
  Download,
  ShieldCheck,
  SendHorizontal,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBlueprintStore } from '../../store/blueprint.store';
import { useBlueprintCommands } from '../../hooks/use-blueprint-commands';
import { useBlueprintLayout } from '../../hooks/use-blueprint-layout';
import { useGuidedMode } from '../../hooks/use-guided-mode';
import { BlueprintSearchFilter } from './blueprint-search-filter';
import { toast } from '@/components/ui/toast';
import type { LayoutDirection, LayoutAlgorithm } from '../../types/canvas.types';

interface BlueprintToolbarProps {
  onToggleValidation: () => void;
  showValidation: boolean;
}

/** React component rendering blueprint toolbar. */
export function BlueprintToolbar({ onToggleValidation, showValidation }: BlueprintToolbarProps) {
  const { fitView } = useReactFlow();
  const { undo, redo, canUndo, canRedo } = useBlueprintCommands();
  const { getLayoutedElements, saveSnapshotForReset, resetLayout } = useBlueprintLayout();
  const { goToNextStep } = useGuidedMode();

  const nodes = useBlueprintStore((s) => s.nodes);
  const edges = useBlueprintStore((s) => s.edges);
  const setNodes = useBlueprintStore((s) => s.setNodes);
  const setEdges = useBlueprintStore((s) => s.setEdges);
  const revision = useBlueprintStore((s) => s.revision);
  const layoutDirection = useBlueprintStore((s) => s.layoutDirection);
  const setLayoutDirection = useBlueprintStore((s) => s.setLayoutDirection);
  const autosaveStatus = useBlueprintStore((s) => s.autosaveStatus);
  const presenceUsers = useBlueprintStore((s) => s.presenceUsers);
  const isCanvasLocked = useBlueprintStore((s) => s.isCanvasLocked);
  const setIsCanvasLocked = useBlueprintStore((s) => s.setIsCanvasLocked);
  const setIsFullscreen = useBlueprintStore((s) => s.setIsFullscreen);

  const setIsHistoryOpen = useBlueprintStore((s) => s.setIsHistoryOpen);
  const setIsSnapshotsOpen = useBlueprintStore((s) => s.setIsSnapshotsOpen);
  const setIsTemplatesOpen = useBlueprintStore((s) => s.setIsTemplatesOpen);
  const setIsImportOpen = useBlueprintStore((s) => s.setIsImportOpen);
  const setIsExportOpen = useBlueprintStore((s) => s.setIsExportOpen);
  const setIsBulkAddOpen = useBlueprintStore((s) => s.setIsBulkAddOpen);
  const setIsShortcutsOpen = useBlueprintStore((s) => s.setIsShortcutsOpen);
  const setIsReadinessOpen = useBlueprintStore((s) => s.setIsReadinessOpen);

  // Apply layout algorithm
  const handleApplyLayout = (dir: LayoutDirection, algo: LayoutAlgorithm = 'hierarchical') => {
    saveSnapshotForReset();
    setLayoutDirection(dir);
    const layouted = getLayoutedElements(nodes, edges, dir, algo);
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
    setTimeout(() => fitView({ duration: 300 }), 50);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleRequestApproval = () => {
    toast.success('Approval requested', 'Blueprint has been submitted for administrative review.');
  };

  // Node status counts
  const incompleteCount = nodes.filter((n) => n.data.effectiveStatus === 'incomplete').length;
  const blockedCount = nodes.filter((n) => n.data.effectiveStatus === 'blocked').length;

  return (
    <div className="h-10 border-b border-[#232323] px-3 flex items-center justify-between bg-[#111111]/90 backdrop-blur-sm z-20">
      {/* Left: Layout, Direction, History, Guided Mode */}
      <div className="flex items-center gap-1.5">
        {/* Layout direction picker */}
        <div className="flex items-center bg-[#161616] border border-[#232323] rounded p-0.5">
          <Button
            variant={layoutDirection === 'TB' ? 'outline' : 'ghost'}
            size="icon"
            className="h-6 w-6 rounded-sm text-xs"
            onClick={() => handleApplyLayout('TB')}
            title="Vertical Layout (TB)"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={layoutDirection === 'LR' ? 'outline' : 'ghost'}
            size="icon"
            className="h-6 w-6 rounded-sm text-xs"
            onClick={() => handleApplyLayout('LR')}
            title="Horizontal Layout (LR)"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={layoutDirection === 'BT' ? 'outline' : 'ghost'}
            size="icon"
            className="h-6 w-6 rounded-sm text-xs"
            onClick={() => handleApplyLayout('BT')}
            title="Bottom to Top (BT)"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={layoutDirection === 'RL' ? 'outline' : 'ghost'}
            size="icon"
            className="h-6 w-6 rounded-sm text-xs"
            onClick={() => handleApplyLayout('RL')}
            title="Right to Left (RL)"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Layout algorithm presets */}
        <div className="flex items-center bg-[#161616] border border-[#232323] rounded p-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] uppercase font-mono text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => handleApplyLayout(layoutDirection, 'compact')}
            title="Compact Layout (tighter spacing)"
          >
            Compact
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] uppercase font-mono text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => handleApplyLayout(layoutDirection, 'department')}
            title="Department Layout (grouped columns)"
          >
            Dept
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-[10px] font-mono text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={resetLayout}
            title="Revert to manual positions before layout"
          >
            Reset
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
          onClick={() => fitView({ duration: 300 })}
          title="Fit to screen"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>

        {/* Canvas Lock */}
        <Button
          variant={isCanvasLocked ? 'primary' : 'ghost'}
          size="icon"
          className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
          onClick={() => setIsCanvasLocked(!isCanvasLocked)}
          title={isCanvasLocked ? 'Unlock canvas' : 'Lock canvas (prevent drags)'}
        >
          {isCanvasLocked ? <Lock className="h-3.5 w-3.5 text-[#0A0A0A]" /> : <Unlock className="h-3.5 w-3.5" />}
        </Button>

        {/* Fullscreen */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
        >
          <Maximize className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-[#232323] mx-0.5" />

        {/* Undo / Redo */}
        <Button
          variant="ghost"
          size="icon"
          disabled={!canUndo}
          className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
          onClick={() => void undo()}
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          disabled={!canRedo}
          className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
          onClick={() => void redo()}
          title="Redo (Ctrl+Y)"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-[#232323] mx-0.5" />

        {/* Guided Mode Next Step Button (G10) */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 border-[#FACC15]/40 text-[#FACC15] hover:bg-[#FACC15]/10"
          onClick={goToNextStep}
        >
          <Compass className="h-3.5 w-3.5 text-[#FACC15]" />
          <span>Next step</span>
        </Button>

        {/* Bulk Add */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1 text-[#8A8A8A] hover:text-[#FAFAFA]"
          onClick={() => setIsBulkAddOpen(true)}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Bulk Add</span>
        </Button>
      </div>

      {/* Center: Search and Filters */}
      <BlueprintSearchFilter />

      {/* Right: Modals, Collab Presence, Readiness & Approval */}
      <div className="flex items-center gap-2">
        {/* Templates, Import, Export */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => setIsTemplatesOpen(true)}
            title="Templates & Starter Kits"
          >
            <Layers className="h-3.5 w-3.5 text-[#FACC15]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => setIsImportOpen(true)}
            title="Import JSON/Excel"
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => setIsExportOpen(true)}
            title="Export Graph"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => setIsSnapshotsOpen(true)}
            title="Snapshots & Visual Diff"
          >
            <Camera className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => setIsHistoryOpen(true)}
            title="Command History Log"
          >
            <History className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]"
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard Shortcuts (?)"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="h-4 w-px bg-[#232323]" />

        {/* Readiness Drawer Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5 border-[#232323] text-[#22C55E]"
          onClick={() => setIsReadinessOpen(true)}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Readiness</span>
        </Button>

        {/* Validation Drawer Toggle */}
        <Button
          variant={showValidation ? 'outline' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1.5 text-[#8A8A8A] hover:text-[#FAFAFA]"
          onClick={onToggleValidation}
        >
          {incompleteCount === 0 && blockedCount === 0 ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 text-[#FACC15]" />
          )}
          <span>Issues</span>
          {(incompleteCount > 0 || blockedCount > 0) && (
            <span className="font-mono text-[10px] bg-[#232323] px-1 rounded text-[#FAFAFA]">
              {incompleteCount + blockedCount}
            </span>
          )}
        </Button>

        {/* Request Approval Action */}
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 border-[#232323] text-[#FACC15] hover:bg-[#FACC15]/10"
          onClick={handleRequestApproval}
          title="Submit to Admin for approval"
        >
          <SendHorizontal className="h-3 w-3" />
          <span>Submit</span>
        </Button>

        <div className="h-4 w-px bg-[#232323]" />

        {/* Presence Avatars */}
        {presenceUsers.length > 0 && (
          <div className="flex items-center -space-x-1.5 overflow-hidden">
            {presenceUsers.map((u) => (
              <div
                key={u.userId}
                title={u.name}
                className="w-5 h-5 rounded-full border border-[#0A0A0A] flex items-center justify-center text-[9px] font-mono font-bold text-[#0A0A0A]"
                style={{ backgroundColor: u.color }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}

        {/* Autosave Indicator */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#8A8A8A]">
          {autosaveStatus === 'saving' && (
            <>
              <RefreshCw className="h-3 w-3 animate-spin text-[#FACC15]" />
              <span className="text-[#FACC15]">Saving...</span>
            </>
          )}
          {autosaveStatus === 'saved' && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span>Saved</span>
            </>
          )}
          {autosaveStatus === 'offline' && (
            <>
              <WifiOff className="h-3 w-3 text-[#EF4444]" />
              <span className="text-[#EF4444]">Offline</span>
            </>
          )}
        </div>

        {/* Revision badge */}
        <Badge variant="neutral" className="font-mono text-[10px] text-[#8A8A8A] border-[#232323]">
          rev {revision}
        </Badge>
      </div>
    </div>
  );
}
