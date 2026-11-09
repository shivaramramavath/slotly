// React component rendering academic projects list with sys0 cards, filters, and lifecycle dialogs.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  ArrowRight,
  FolderPlus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';
import { PageHeader } from '@/components/layouts/page-header';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectCard, ProjectCardSkeleton } from '@/features/projects/components/project-card';
import { projectsApi } from '@/features/projects/services/projects.api';
import type { ProjectDto } from '@slotly/contracts';

/** React component rendering projects page matching sys0 visual guidelines. */
export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [duplicateTarget, setDuplicateTarget] = React.useState<ProjectDto | null>(null);
  const [duplicateName, setDuplicateName] = React.useState('');
  const [archiveTarget, setArchiveTarget] = React.useState<ProjectDto | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['projects', statusFilter, search],
    queryFn: () =>
      projectsApi.listProjects({
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

  const duplicateMutation = useMutation({
    mutationFn: (args: { id: string; name: string }) =>
      projectsApi.duplicateProject(args.id, { name: args.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setDuplicateTarget(null);
      setDuplicateName('');
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => projectsApi.archiveProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setArchiveTarget(null);
    },
  });

  const projects = data?.items || [];

  return (
    <AppLayout>
      {/* Visual Page Header */}
      <PageHeader
        title="Academic Projects"
        description="Timetable projects, term settings, and visual blueprint structures."
        actions={
          <>
            <Link
              href="/blueprint-templates"
              className="text-xs text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors inline-flex items-center gap-1.5 font-mono py-1.5 px-1"
            >
              <span>Templates and Kits</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
            <Link href="/projects/new">
              <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>New project</span>
              </Button>
            </Link>
          </>
        }
      />

      {/* Filter Row: Single clean row with search input and compact status selector */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#8A8A8A]" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Search projects by name"
            placeholder="Search projects by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-10 text-xs bg-[#111111] border-[#232323] rounded-[12px] placeholder:text-[#8A8A8A] focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
          />
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <Select
            aria-label="Filter by project lifecycle status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 text-xs bg-[#111111] border-[#232323] rounded-[12px] text-[#FAFAFA] focus-visible:ring-1 focus-visible:ring-[#FAFAFA]"
          >
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="building">Building</option>
            <option value="ready">Ready</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
      </div>

      {/* Content Viewport */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <SurfaceCard className="p-8 text-center items-center justify-center min-h-[300px]">
          <AlertCircle className="w-10 h-10 text-[#EF4444] mb-3" />
          <h3 className="text-base font-semibold text-[#FAFAFA] mb-1">
            Failed to load academic projects
          </h3>
          <p className="text-xs font-mono text-[#8A8A8A] max-w-md mb-6">
            {(error as Error)?.message || 'An unexpected error occurred while communicating with the server.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 font-mono text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </SurfaceCard>
      ) : projects.length === 0 ? (
        <SurfaceCard className="p-10 text-center items-center justify-center min-h-[320px]">
          <div className="h-12 w-12 rounded-2xl bg-[#181818] border border-[#232323] flex items-center justify-center text-[#8A8A8A] mb-4">
            <FolderPlus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-[#FAFAFA] mb-1.5 tracking-tight">
            No academic projects found
          </h3>
          <p className="text-xs font-mono text-[#8A8A8A] max-w-md mb-6">
            Create your first timetable term or start from a pre-configured template kit.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/projects/new">
              <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>New project</span>
              </Button>
            </Link>
            <Link
              href="/blueprint-templates"
              className="text-xs text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors font-mono py-1.5 px-3"
            >
              Start from a template &rarr;
            </Link>
          </div>
        </SurfaceCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => (
            <ProjectCard
              key={proj.id}
              project={proj}
              onDuplicate={(p) => {
                setDuplicateTarget(p);
                setDuplicateName(`${p.name} (Copy)`);
              }}
              onArchive={(p) => setArchiveTarget(p)}
              isPending={
                (duplicateMutation.isPending && duplicateTarget?.id === proj.id) ||
                (archiveMutation.isPending && archiveTarget?.id === proj.id)
              }
            />
          ))}
        </div>
      )}

      {/* Duplicate Dialog */}
      <Dialog
        open={Boolean(duplicateTarget)}
        onOpenChange={(open) => {
          if (!open) setDuplicateTarget(null);
        }}
      >
        <DialogHeader>
          <DialogTitle>Duplicate Project</DialogTitle>
          <DialogDescription>
            Create a full copy of &ldquo;{duplicateTarget?.name}&rdquo; including its blueprint graph and period settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#8A8A8A]">New Project Name</label>
            <Input
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="e.g. Fall 2026 (Copy)"
              className="text-xs bg-[#111111] border-[#232323] rounded-[12px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => setDuplicateTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!duplicateName.trim() || duplicateMutation.isPending}
            onClick={() => {
              if (duplicateTarget) {
                duplicateMutation.mutate({ id: duplicateTarget.id, name: duplicateName });
              }
            }}
          >
            Duplicate
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title={`Archive ${archiveTarget?.name}?`}
        description="Archiving will lock the project and prevent further blueprint edits. You can restore it later if needed."
        confirmLabel="Archive Project"
        onConfirm={() => {
          if (archiveTarget) {
            archiveMutation.mutate(archiveTarget.id);
          }
        }}
      />
    </AppLayout>
  );
}
