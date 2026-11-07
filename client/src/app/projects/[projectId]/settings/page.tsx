'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Save,
  ArrowLeft,
  Clock,
  Plus,
  Trash2,
  Archive,
  AlertTriangle,
  Layout,
} from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ProjectStatusBadge } from '@/features/projects/components/project-status-badge';
import { projectsApi } from '@/features/projects/services/projects.api';
import type { PeriodBreak, ProjectDto, ProjectStrictness, TermKind } from '@slotly/contracts';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'general' | 'schedule' | 'danger'>('general');
  const [syncedId, setSyncedId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [termKind, setTermKind] = useState<TermKind>('odd');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [academicYearLabel, setAcademicYearLabel] = useState('');
  const [strictness, setStrictness] = useState<ProjectStrictness>('strict');

  // Schedule Settings State
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [periodsPerDay, setPeriodsPerDay] = useState(7);
  const [periodDuration, setPeriodDuration] = useState(50);
  const [startTime, setStartTime] = useState('09:00');
  const [breaks, setBreaks] = useState<PeriodBreak[]>([]);
  const [perDayOverrides, setPerDayOverrides] = useState<
    Record<string, { periods?: number | undefined; startTime?: string | undefined }>
  >({});

  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getProject(projectId),
  });

  // Synchronize state during render phase (React 19 pattern)
  if (project && syncedId !== project.id) {
    setSyncedId(project.id);
    setName(project.name);
    setTermKind(project.term?.kind || 'odd');
    setStartDate(project.term?.startDate || '');
    setEndDate(project.term?.endDate || '');
    setAcademicYearLabel(project.term?.academicYearLabel || '');
    setStrictness(project.strictness || 'strict');

    setDays(project.settings?.days || [1, 2, 3, 4, 5]);
    setPeriodsPerDay(project.settings?.periodsPerDay || 7);
    setPeriodDuration(project.settings?.periodDuration || 50);
    setStartTime(project.settings?.startTime || '09:00');
    setBreaks(project.settings?.breaks || []);
    setPerDayOverrides(project.settings?.perDayOverrides || {});
  }

  const updateMutation = useMutation({
    mutationFn: (dto: Partial<ProjectDto>) =>
      projectsApi.updateProject(projectId, dto, project?.revision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => projectsApi.archiveProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setArchiveConfirmOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.deleteProject(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      router.push('/dashboard');
    },
  });

  const toggleDay = (dayId: number) => {
    setDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId].sort(),
    );
  };

  const addBreak = () => {
    setBreaks((prev) => [
      ...prev,
      { name: `Break ${prev.length + 1}`, afterPeriod: 2, durationMinutes: 15 },
    ]);
  };

  const removeBreak = (index: number) => {
    setBreaks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    updateMutation.mutate({
      name,
      term: {
        kind: termKind,
        startDate,
        endDate,
        academicYearLabel,
      },
      strictness,
      settings: {
        days,
        periodsPerDay,
        periodDuration,
        startTime,
        breaks,
        perDayOverrides,
      },
    });
  };

  if (isLoading || !project) {
    return (
      <AppLayout activePath="/dashboard">
        <div className="h-48 max-w-4xl mx-auto rounded border border-[#232323] bg-[#111] animate-pulse" />
      </AppLayout>
    );
  }

  return (
    <AppLayout activePath="/dashboard">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 font-mono text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Projects</span>
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#FAFAFA]">{project.name}</h1>
                <ProjectStatusBadge status={project.status} />
              </div>
              <p className="text-xs font-mono text-[#8A8A8A]">
                Revision {project.revision} &bull; Term: {project.term?.kind?.toUpperCase()} ({project.term?.academicYearLabel})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/projects/${projectId}/blueprint`}>
              <Button variant="outline" size="sm" className="gap-1.5 font-mono text-xs">
                <Layout className="w-3.5 h-3.5" />
                <span>Open Canvas</span>
              </Button>
            </Link>

            <Button
              variant="primary"
              size="sm"
              disabled={updateMutation.isPending}
              onClick={handleSave}
              className="gap-1.5 font-mono text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveSuccess ? 'Saved!' : 'Save Changes'}</span>
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs
          defaultValue="general"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as 'general' | 'schedule' | 'danger')}
        >
          <TabsList className="border-b border-[#232323]">
            <TabsTrigger value="general">
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              General & Term
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Schedule Timing & Breaks
            </TabsTrigger>
            <TabsTrigger value="danger">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-[#EF4444]" />
              Danger Zone
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: General */}
          <TabsContent value="general" className="pt-4">
            <Card className="bg-[#0A0A0A] border border-[#232323]">
              <CardHeader>
                <CardTitle className="text-sm">Term & Metadata</CardTitle>
                <CardDescription>Basic timetable parameters and schedule strictness level.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#8A8A8A]">Project Name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#8A8A8A]">Term Kind</label>
                    <Select
                      value={termKind}
                      onChange={(e) => setTermKind(e.target.value as TermKind)}
                    >
                      <option value="odd">Odd Term (Fall)</option>
                      <option value="even">Even Term (Spring)</option>
                      <option value="custom">Custom Session</option>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#8A8A8A]">Academic Year Label</label>
                    <Input
                      value={academicYearLabel}
                      onChange={(e) => setAcademicYearLabel(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#8A8A8A]">Term Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#8A8A8A]">Term End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[#181818]">
                  <label className="text-xs font-mono text-[#8A8A8A]">Constraint Strictness</label>
                  <Select
                    value={strictness}
                    onChange={(e) => setStrictness(e.target.value as ProjectStrictness)}
                  >
                    <option value="strict">Strict (Zero Hard Constraint Violations Allowed)</option>
                    <option value="flexible">Flexible (Allows Soft Preferences To Be Relaxed)</option>
                    <option value="relaxed">Relaxed (Permits Warnings During Experimental Runs)</option>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Schedule Timing */}
          <TabsContent value="schedule" className="pt-4 space-y-4">
            <Card className="bg-[#0A0A0A] border border-[#232323]">
              <CardHeader>
                <CardTitle className="text-sm">Weekly Periods & Timings</CardTitle>
                <CardDescription>Setup default period slots and lunch/tea intervals.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Working Days */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-[#8A8A8A]">Active Working Days</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS_OF_WEEK.map((d) => {
                      const active = days.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleDay(d.id)}
                          className={`h-8 w-12 rounded border text-xs font-mono font-medium transition-colors ${
                            active
                              ? 'bg-[#FACC15] text-[#000] border-[#FACC15]'
                              : 'bg-[#111] text-[#8A8A8A] border-[#232323] hover:text-[#FAFAFA]'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Periods Config */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#8A8A8A]">Periods / Day</label>
                    <Input
                      type="number"
                      min={1}
                      max={14}
                      value={periodsPerDay}
                      onChange={(e) => setPeriodsPerDay(parseInt(e.target.value, 10) || 7)}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#8A8A8A]">Period Duration (mins)</label>
                    <Input
                      type="number"
                      min={30}
                      max={180}
                      value={periodDuration}
                      onChange={(e) => setPeriodDuration(parseInt(e.target.value, 10) || 50)}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-[#8A8A8A]">Day Start Time</label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Breaks Manager */}
                <div className="space-y-3 pt-3 border-t border-[#181818]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono text-[#8A8A8A]">Breaks & Lunch Intervals</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBreak}
                      className="h-7 text-xs font-mono gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Interval</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {breaks.map((b, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-[#111] border border-[#232323] flex items-center gap-3 text-xs"
                      >
                        <Input
                          value={b.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setBreaks((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, name: val } : item)),
                            );
                          }}
                          placeholder="Break Name"
                          className="h-8 text-xs flex-1"
                        />

                        <div className="flex items-center gap-1 font-mono text-[11px] text-[#8A8A8A]">
                          <span>After Period</span>
                          <Input
                            type="number"
                            min={1}
                            max={periodsPerDay}
                            value={b.afterPeriod}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 1;
                              setBreaks((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, afterPeriod: val } : item,
                                ),
                              );
                            }}
                            className="h-8 w-14 text-xs font-mono"
                          />
                        </div>

                        <div className="flex items-center gap-1 font-mono text-[11px] text-[#8A8A8A]">
                          <Input
                            type="number"
                            min={5}
                            max={120}
                            value={b.durationMinutes}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10) || 15;
                              setBreaks((prev) =>
                                prev.map((item, i) =>
                                  i === idx ? { ...item, durationMinutes: val } : item,
                                ),
                              );
                            }}
                            className="h-8 w-16 text-xs font-mono"
                          />
                          <span>mins</span>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeBreak(idx)}
                          className="h-8 w-8 p-0 hover:border-[#EF4444]"
                        >
                          <Trash2 className="w-3 h-3 text-[#EF4444]" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Danger Zone */}
          <TabsContent value="danger" className="pt-4">
            <Card className="bg-[#0A0A0A] border border-[#EF4444]/40">
              <CardHeader>
                <CardTitle className="text-sm text-[#EF4444]">Danger Zone</CardTitle>
                <CardDescription>Irreversible and status-locking project actions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded bg-[#111] border border-[#232323]">
                  <div>
                    <div className="text-xs font-medium text-[#FAFAFA]">Archive Project</div>
                    <div className="text-[11px] text-[#8A8A8A] font-mono">
                      Locks the project graph into read-only mode.
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={project.status === 'archived'}
                    onClick={() => setArchiveConfirmOpen(true)}
                    className="font-mono text-xs text-[#EF4444] hover:bg-[#EF4444]/10"
                  >
                    <Archive className="w-3.5 h-3.5 mr-1" />
                    {project.status === 'archived' ? 'Already Archived' : 'Archive'}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 rounded bg-[#111] border border-[#232323]">
                  <div>
                    <div className="text-xs font-medium text-[#FAFAFA]">Delete Project</div>
                    <div className="text-[11px] text-[#8A8A8A] font-mono">
                      Soft-deletes the project and its attached blueprint graph.
                    </div>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="font-mono text-xs"
                  >
                    Delete Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Archive Confirmation */}
        <ConfirmDialog
          open={archiveConfirmOpen}
          onOpenChange={setArchiveConfirmOpen}
          title={`Archive ${project.name}?`}
          description="Archiving this project will freeze the visual blueprint canvas and disable edits."
          confirmLabel="Archive"
          onConfirm={() => archiveMutation.mutate()}
        />

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title={`Delete ${project.name}?`}
          description="Are you sure you want to delete this project? This action cannot be undone."
          variant="danger"
          confirmLabel="Delete Project"
          onConfirm={() => deleteMutation.mutate()}
        />
      </div>
    </AppLayout>
  );
}
