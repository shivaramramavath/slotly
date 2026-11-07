'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Layers, AlertTriangle, Sparkles } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { useBlueprintStore } from '../store/blueprint.store';
import { useBlueprintSocket } from '../hooks/use-blueprint-socket';
import { BlueprintCanvas } from './canvas/blueprint-canvas';
import { BlueprintPalette } from './palette/blueprint-palette';
import { BlueprintSidebar } from './sidebar/blueprint-sidebar';
import { BlueprintToolbar } from './toolbar/blueprint-toolbar';
import { ParentRegressionBanner } from './dialogs/parent-regression-banner';
import { ValidationPanel } from './dialogs/validation-panel';
import { ImpactPreviewDialog } from './dialogs/impact-preview-dialog';
import { BulkAddDialog } from './dialogs/bulk-add-dialog';
import { TemplatesDialog } from './dialogs/templates-dialog';
import { SaveTemplateDialog } from './dialogs/save-template-dialog';
import { ExportDialog } from './dialogs/export-dialog';
import { ImportDialog } from './dialogs/import-dialog';
import { HistoryDialog } from './dialogs/history-dialog';
import { SnapshotsDialog } from './dialogs/snapshots-dialog';
import { RevisionConflictDialog } from './dialogs/revision-conflict-dialog';
import { NodeCommentsDialog } from './dialogs/node-comments-dialog';
import { ShortcutsDialog } from './dialogs/shortcuts-dialog';
import { ReadinessDialog } from './dialogs/readiness-dialog';
import type { BlueprintNodeType } from '@slotly/contracts';

interface BlueprintWorkspaceProps {
  projectId: string;
}

export function BlueprintWorkspace({ projectId }: BlueprintWorkspaceProps) {
  const router = useRouter();
  const [showValidation, setShowValidation] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const initGraph = useBlueprintStore((s) => s.initGraph);
  const isInitialLoading = useBlueprintStore((s) => s.isInitialLoading);
  const nodes = useBlueprintStore((s) => s.nodes);

  // Connect WebSocket gateway
  const {
    addNode,
    deleteNode,
    addEdge,
    moveNode,
    updateNodeConfig,
    sendCursor,
  } = useBlueprintSocket(projectId);

  // Fetch initial graph
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const graph = await blueprintApi.getGraph(projectId);
        if (mounted) {
          initGraph(projectId, graph);
        }
      } catch (err) {
        if (mounted) {
          setLoadError((err as Error).message || 'Failed to load blueprint graph.');
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [projectId, initGraph]);

  const handleAddNode = async (
    type: BlueprintNodeType,
    parentId?: string,
    position = { x: 250, y: 150 },
  ) => {
    return addNode(type, parentId, position, {
      name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    });
  };

  const handleConfirmDelete = async (nodeId: string) => {
    await deleteNode(nodeId);
  };

  const handleBatchAddNodes = async (
    batchNodes: Array<{ type: BlueprintNodeType; parentId?: string; name: string }>,
  ) => {
    for (const item of batchNodes) {
      await addNode(
        item.type,
        item.parentId,
        { x: 250 + Math.random() * 60, y: 150 + Math.random() * 60 },
        { name: item.name },
      );
    }
  };

  const handleReloadServerState = async () => {
    const graph = await blueprintApi.getGraph(projectId);
    initGraph(projectId, graph);
  };

  const handleForceOverwrite = async () => {
    const graph = await blueprintApi.getGraph(projectId);
    initGraph(projectId, graph);
  };

  const handleImportSuccess = async () => {
    const graph = await blueprintApi.getGraph(projectId);
    initGraph(projectId, graph);
  };

  const handleBuildSchedule = () => {
    router.push(`/projects/${projectId}/editor`);
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A] text-[#FAFAFA] p-4">
        <AlertTriangle className="h-10 w-10 text-[#EF4444] mb-3" />
        <h2 className="text-base font-semibold">Failed to load Blueprint</h2>
        <p className="text-xs text-[#8A8A8A] font-mono mt-1 mb-4">{loadError}</p>
        <Link href="/projects">
          <Button variant="outline" size="sm">
            Return to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col bg-[#0A0A0A] text-[#FAFAFA] overflow-hidden">
        {/* Studio Header */}
        <header className="h-11 border-b border-[#232323] px-3 flex items-center justify-between bg-[#111111] shrink-0 z-20">
          <div className="flex items-center gap-3">
            <Link href={`/projects/${projectId}/settings`}>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-[#8A8A8A] hover:text-[#FAFAFA]">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#FAFAFA]">{projectId}</span>
              <span className="text-[#8A8A8A]">/</span>
              <span className="text-xs text-[#8A8A8A]">Blueprint Designer</span>
            </div>
            <Badge variant="yellow" className="font-mono text-[9px] uppercase">
              DRAFT
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/projects/${projectId}/blueprint/readiness`}>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-[#232323]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#22C55E]" />
                <span>Readiness</span>
              </Button>
            </Link>
            <Link href={`/projects/${projectId}/editor`}>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 border-[#232323]">
                <Layers className="h-3.5 w-3.5" />
                <span>Studio Grid</span>
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={handleBuildSchedule}
              disabled={nodes.some((n) => n.data.effectiveStatus !== 'complete')}
              title={
                nodes.some((n) => n.data.effectiveStatus !== 'complete')
                  ? 'All nodes must be complete to build schedule (G5)'
                  : 'Start timetable generation'
              }
            >
              <Sparkles className="h-3 w-3" />
              <span>Build Schedule</span>
            </Button>
          </div>
        </header>

        {/* Parent Regression Warning Banner (G3) */}
        <ParentRegressionBanner />

        {/* Toolbar */}
        <BlueprintToolbar
          showValidation={showValidation}
          onToggleValidation={() => setShowValidation(!showValidation)}
        />

        {/* Main Canvas + Sidebars */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left Palette */}
          <BlueprintPalette onAddNode={handleAddNode} />

          {/* Central ReactFlow Canvas */}
          <main className="flex-1 h-full relative">
            {isInitialLoading ? (
              <div className="w-full h-full flex items-center justify-center text-xs font-mono text-[#8A8A8A]">
                Loading Blueprint Canvas...
              </div>
            ) : (
              <BlueprintCanvas
                onMoveNode={moveNode}
                onAddEdge={addEdge}
                onAddNode={handleAddNode}
                onCursorMove={sendCursor}
              />
            )}
          </main>

          {/* Right Configuration Sidebar */}
          <BlueprintSidebar projectId={projectId} onUpdateConfig={updateNodeConfig} />

          {/* Slide-over Validation Drawer */}
          <ValidationPanel isOpen={showValidation} onClose={() => setShowValidation(false)} />
        </div>

        {/* G4 Delete with Impact Confirmation Dialog */}
        <ImpactPreviewDialog onConfirmDelete={handleConfirmDelete} />

        {/* Phase 7 Advanced Designer Dialogs */}
        <BulkAddDialog onAddBatchNodes={handleBatchAddNodes} />
        <TemplatesDialog onTemplateApplied={handleReloadServerState} />
        <SaveTemplateDialog />
        <ExportDialog />
        <ImportDialog onImportCompleted={handleImportSuccess} />
        <HistoryDialog />
        <SnapshotsDialog onSnapshotRestored={handleReloadServerState} />
        <RevisionConflictDialog
          onReloadServerState={handleReloadServerState}
          onForceOverwrite={handleForceOverwrite}
        />
        <NodeCommentsDialog />
        <ShortcutsDialog />
        <ReadinessDialog onBuildSchedule={handleBuildSchedule} />
      </div>
    </ReactFlowProvider>
  );
}
