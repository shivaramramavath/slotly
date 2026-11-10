// React component for blueprint-workspace.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { ReactFlowProvider } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { useBlueprintStore } from '../store/blueprint.store';
import { useBlueprintSocket } from '../hooks/use-blueprint-socket';
import { BlueprintCanvas } from './canvas/blueprint-canvas';
import { BlueprintSidebar } from './sidebar/blueprint-sidebar';
import { BlueprintHeader } from './header/blueprint-header';
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

/** React component rendering blueprint workspace. */
export function BlueprintWorkspace({ projectId }: BlueprintWorkspaceProps) {
  const router = useRouter();
  const [showValidation, setShowValidation] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const initGraph = useBlueprintStore((s) => s.initGraph);
  const isInitialLoading = useBlueprintStore((s) => s.isInitialLoading);

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
    router.push(`/projects/${projectId}/build`);
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
        {/* Studio Header (Single 48px Header) */}
        <BlueprintHeader
          projectId={projectId}
          onOpenValidation={() => setShowValidation(true)}
          onBuildSchedule={handleBuildSchedule}
        />

        {/* Parent Regression Warning Banner (G3) */}
        <ParentRegressionBanner />

        {/* Main Canvas + Sidebars */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Central ReactFlow Canvas with Floating Bottom Toolbar */}
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

          {/* Right Configuration Sidebar (360px) */}
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
