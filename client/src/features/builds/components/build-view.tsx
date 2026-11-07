'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  ArrowLeft,
  RotateCcw,
  GitCompare,
} from 'lucide-react';
import { useBuildsStore } from '../store/builds.store';
import { buildsApi } from '../services/builds.api';
import { BuildsSocketService } from '../services/builds-socket.service';
import { BuildBlockedView } from './build-blocked-view';
import { BuildConfigCard } from './build-config-card';
import { BuildProgressPanel } from './build-progress-panel';
import { AlternativeCard } from './alternative-card';
import { CompareDialog } from './compare-dialog';

interface BuildViewProps {
  projectId: string;
}

export function BuildView({ projectId }: BuildViewProps) {
  const {
    status,
    progress,
    currentStep,
    currentMessage,
    logs,
    versions,
    readiness,
    isBlocked,
    error,
    comparePair,
    isCompareOpen,
    config,
    setProjectId,
    setConfig,
    setReadiness,
    handleProgress,
    handleCompleted,
    handleFailed,
    setVersions,
    toggleCompareVersion,
    setCompareOpen,
    resetLogs,
  } = useBuildsStore();

  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isStartingBuild, setIsStartingBuild] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Initialize socket and data fetch on mount
  useEffect(() => {
    setProjectId(projectId);

    const socket = new BuildsSocketService({
      onProgress: (payload) => {
        handleProgress(payload);
      },
      onCompleted: (payload) => {
        handleCompleted(payload);
        // Refresh versions list
        buildsApi.getVersions(projectId).then(setVersions).catch(console.error);
      },
      onFailed: (payload) => {
        handleFailed(payload);
      },
    });

    socket.connect(projectId);

    // Initial load
    async function loadInitialData() {
      try {
        setIsLoadingInitial(true);
        const [readinessData, versionsData] = await Promise.all([
          buildsApi.getReadiness(projectId),
          buildsApi.getVersions(projectId),
        ]);
        setReadiness(readinessData);
        setVersions(versionsData);
      } catch (err) {
        console.error('Failed to load build data:', err);
      } finally {
        setIsLoadingInitial(false);
      }
    }

    loadInitialData();

    return () => {
      socket.disconnect();
    };
  }, [projectId, setProjectId, setReadiness, setVersions, handleProgress, handleCompleted, handleFailed]);

  // Re-check readiness
  const handleRefreshReadiness = async () => {
    try {
      const data = await buildsApi.getReadiness(projectId);
      setReadiness(data);
    } catch (err) {
      console.error('Failed to refresh readiness:', err);
    }
  };

  // Start build trigger
  const handleStartBuild = async () => {
    try {
      setIsStartingBuild(true);
      resetLogs();
      handleProgress({
        projectId,
        status: 'running',
        step: 'ENQUEUING',
        progress: 5,
        message: 'Submitting build request to solver pipeline...',
      });

      const generated = await buildsApi.startBuild(projectId, config);
      if (generated && generated.length > 0) {
        setVersions(generated);
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to start generation build';
      handleFailed({
        projectId,
        status: 'failed',
        step: 'FAILED',
        progress: 0,
        message: errorMsg,
        error: errorMsg,
      });
    } finally {
      setIsStartingBuild(false);
    }
  };

  // Cancel build trigger
  const handleCancelBuild = async () => {
    try {
      setIsCancelling(true);
      await buildsApi.cancelBuild(projectId);
      handleFailed({
        projectId,
        status: 'cancelled',
        step: 'CANCELLED',
        progress: 0,
        message: 'Generation build aborted by user.',
      });
    } catch (err) {
      console.error('Failed to cancel build:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoadingInitial) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FACC15] border-t-transparent" />
          <span className="font-mono text-xs text-[#8A8A8A]">
            Evaluating Blueprint completion & engine readiness...
          </span>
        </div>
      </div>
    );
  }

  const [compA, compB] = comparePair;
  const isComparingFull = Boolean(compA && compB);

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232323] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/projects/${projectId}/blueprint`}
              className="flex items-center gap-1 text-xs text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Blueprint</span>
            </Link>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#FAFAFA]">
            Schedule Generation Studio
          </h1>
          <p className="text-xs text-[#8A8A8A]">
            Constraint satisfaction engine: solves hard constraints, optimizes curriculum preferences, and ranks schedule alternatives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefreshReadiness}
            className="flex items-center gap-1.5 rounded-lg border border-[#232323] bg-[#0A0A0A] px-3 py-2 text-xs font-medium text-[#FAFAFA] hover:bg-[#111111] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#8A8A8A]" />
            <span>Re-check Gates</span>
          </button>

          {versions.length > 0 && (
            <Link
              href={`/projects/${projectId}/editor?versionId=${versions[0]?.id}`}
              className="flex items-center gap-1.5 rounded-lg border border-[#FACC15]/40 bg-[#FACC15]/10 px-4 py-2 text-xs font-semibold text-[#FACC15] hover:bg-[#FACC15]/20 transition-colors"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Open Active Timetable</span>
            </Link>
          )}
        </div>
      </div>

      {/* Gate G5 Blocked State */}
      {isBlocked && readiness && (
        <BuildBlockedView projectId={projectId} readiness={readiness} />
      )}

      {/* Solver Configuration and Start Panel */}
      <BuildConfigCard
        config={config}
        onChange={setConfig}
        onStart={handleStartBuild}
        disabled={isBlocked || status === 'building'}
        isLoading={isStartingBuild || status === 'building'}
      />

      {/* Progress & Log Execution Panel */}
      {(status === 'building' || logs.length > 0) && (
        <BuildProgressPanel
          status={status}
          progress={progress}
          currentStep={currentStep}
          currentMessage={currentMessage}
          logs={logs}
          error={error}
          onCancel={handleCancelBuild}
          isCancelling={isCancelling}
        />
      )}

      {/* Generated Alternatives Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#232323] pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-[#FAFAFA]">
              Generated Alternatives
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-[#111111] border border-[#232323] text-[#8A8A8A]">
              {versions.length}
            </span>
          </div>

          {/* Quick compare banner if 2 selected */}
          {compA && compB && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[#FACC15] px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-[#FACC15]/90 transition-all shadow-sm"
            >
              <GitCompare className="h-3.5 w-3.5" />
              <span>Compare v{compA.versionNo} vs v{compB.versionNo}</span>
            </button>
          )}
        </div>

        {versions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#232323] bg-[#0A0A0A] p-10 text-center">
            <Layers className="mx-auto h-8 w-8 text-[#8A8A8A]/50 mb-3" />
            <h3 className="text-sm font-semibold text-[#FAFAFA]">
              No Timetable Versions Generated Yet
            </h3>
            <p className="text-xs text-[#8A8A8A] mt-1 max-w-sm mx-auto">
              Configure your preferences above and click &quot;Generate Timetable&quot; to run the constraint solver.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {versions.map((ver) => (
              <AlternativeCard
                key={ver.id}
                version={ver}
                projectId={projectId}
                isCompared={compA?.id === ver.id || compB?.id === ver.id}
                onToggleCompare={toggleCompareVersion}
                isComparingFull={isComparingFull}
              />
            ))}
          </div>
        )}
      </div>

      {/* Compare Modal Dialog */}
      <CompareDialog
        isOpen={isCompareOpen}
        onClose={() => setCompareOpen(false)}
        versionA={compA}
        versionB={compB}
        projectId={projectId}
      />
    </div>
  );
}
