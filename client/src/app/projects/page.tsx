// React component for page.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Plus,
  Search,
  Copy,
  Archive,
  Settings as SettingsIcon,
  Clock,
  Layout,
} from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { projectsApi } from '@/features/projects/services/projects.api';
import type { ProjectDto } from '@slotly/contracts';

/** React component rendering projects page. */
export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [duplicateTarget, setDuplicateTarget] = useState<ProjectDto | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [archiveTarget, setArchiveTarget] = useState<ProjectDto | null>(null);

  const { data, isLoading } = useQuery({
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
    <AppLayout activePath="/dashboard">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#FAFAFA]">Academic Projects</h1>
            <p className="text-xs text-[#8A8A8A] font-mono">
              Timetable projects, term settings, and visual blueprint structures.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/blueprint-templates">
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Layout className="h-3.5 w-3.5" />
                <span>Templates & Kits</span>
              </Button>
            </Link>
            <Link href="/projects/new">
              <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
                <Plus className="h-3.5 w-3.5" />
                <span>New Project</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-[#0A0A0A] border border-[#232323] rounded-md">
          <div className="relative min-w-64 flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8A8A8A]" />
            <Input
              placeholder="Search projects by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 rounded-md border border-[#232323] bg-[#111] animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-8 w-8 text-[#8A8A8A]" />}
            title="No academic projects found"
            description="Create your first timetable term or start from a pre-configured template kit."
            action={
              <Link href="/projects/new">
                <Button variant="primary" size="sm" className="gap-1.5 font-mono text-xs">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Project</span>
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((proj) => {
              const daysCount = proj.settings?.days?.length || 5;
              const periodsCount = proj.settings?.periodsPerDay || 7;

              return (
                <Card
                  key={proj.id}
                  className="bg-[#0A0A0A] border border-[#232323] hover:border-[#8A8A8A]/40 transition-colors flex flex-col justify-between"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <ProjectStatusBadge status={proj.status} />
                      <span className="font-mono text-[11px] text-[#8A8A8A]">
                        Rev {proj.revision}
                      </span>
                    </div>
                    <CardTitle className="text-sm font-semibold text-[#FAFAFA] mt-2">
                      {proj.name}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono text-[#8A8A8A]">
                      Term: {proj.term?.kind?.toUpperCase()} ({proj.term?.startDate} &rarr; {proj.term?.endDate})
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-[#8A8A8A] py-2 border-y border-[#181818]">
                      <span>{daysCount} Days / Wk</span>
                      <span>&bull;</span>
                      <span>{periodsCount} Periods / Day</span>
                      <span>&bull;</span>
                      <span className="capitalize">{proj.strictness}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-[#8A8A8A]">
                        <Clock className="w-3 h-3 text-[#8A8A8A]" />
                        <span>
                          {proj.lastOpenedAt
                            ? `Opened ${new Date(proj.lastOpenedAt).toLocaleDateString()}`
                            : 'Not opened yet'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Link href={`/projects/${proj.id}/blueprint`}>
                          <Button variant="primary" size="sm" className="h-7 text-xs font-mono px-2.5">
                            Canvas
                          </Button>
                        </Link>

                        <Link href={`/projects/${proj.id}/settings`}>
                          <Button variant="outline" size="sm" className="h-7 w-7 p-0" title="Project Settings">
                            <SettingsIcon className="w-3.5 h-3.5 text-[#FAFAFA]" />
                          </Button>
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Duplicate Project"
                          onClick={() => {
                            setDuplicateTarget(proj);
                            setDuplicateName(`${proj.name} (Copy)`);
                          }}
                        >
                          <Copy className="w-3.5 h-3.5 text-[#8A8A8A]" />
                        </Button>

                        {proj.status !== 'archived' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 hover:border-[#EF4444]"
                            title="Archive Project"
                            onClick={() => setArchiveTarget(proj)}
                          >
                            <Archive className="w-3.5 h-3.5 text-[#8A8A8A]" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Duplicate Dialog */}
        <Dialog
          open={!!duplicateTarget}
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
                className="text-xs"
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

        {/* Archive Confirmation */}
        <ConfirmDialog
          open={!!archiveTarget}
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
      </div>
    </AppLayout>
  );
}
