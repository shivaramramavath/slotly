// React component for page.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Building2,
  Layout,
  FilePlus,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { projectsApi } from '@/features/projects/services/projects.api';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import type { CreateProjectDto, PeriodBreak, TermKind } from '@slotly/contracts';

const DAYS_OF_WEEK = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' },
];

/** React component rendering new project wizard page. */
export default function NewProjectWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Details
  const [name, setName] = useState('');
  const [termKind, setTermKind] = useState<TermKind>('odd');
  const [startDate, setStartDate] = useState('2026-08-01');
  const [endDate, setEndDate] = useState('2026-12-20');
  const [academicYearLabel, setAcademicYearLabel] = useState('2026-2027');

  // Step 2: Source
  const [source, setSource] = useState<'empty' | 'institution' | 'template'>('empty');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Step 3: Settings
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [periodsPerDay, setPeriodsPerDay] = useState(7);
  const [periodDuration, setPeriodDuration] = useState(50);
  const [startTime, setStartTime] = useState('09:00');
  const [breaks, setBreaks] = useState<PeriodBreak[]>([
    { name: 'Lunch Break', afterPeriod: 4, durationMinutes: 50 },
  ]);

  // Load templates
  const { data: templates } = useQuery({
    queryKey: ['blueprint-templates'],
    queryFn: () => blueprintApi.listTemplates(),
  });

  const createMutation = useMutation({
    mutationFn: (dto: CreateProjectDto) => projectsApi.createProject(dto),
    onSuccess: (project) => {
      router.push(`/projects/${project.id}/settings`);
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

  const handleFinish = () => {
    const dto: CreateProjectDto = {
      name,
      term: {
        kind: termKind,
        startDate,
        endDate,
        academicYearLabel,
      },
      source,
      templateId: source === 'template' ? selectedTemplateId : undefined,
      settings: {
        days,
        periodsPerDay,
        periodDuration,
        startTime,
        breaks,
        perDayOverrides: {},
      },
      strictness: 'strict',
    };

    createMutation.mutate(dto);
  };

  return (
    <AppLayout activePath="/dashboard">
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        {/* Wizard Header */}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#FAFAFA]">New Academic Project</h1>
          <p className="text-xs text-[#8A8A8A] font-mono">
            Step {step} of 3: {step === 1 ? 'Project Details' : step === 2 ? 'Initial Structure' : 'Period Timing & Settings'}
          </p>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s === step
                  ? 'bg-[#FACC15]'
                  : s < step
                    ? 'bg-[#22C55E]'
                    : 'bg-[#232323]'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Project Details */}
        {step === 1 && (
          <Card className="bg-[#0A0A0A] border border-[#232323]">
            <CardHeader>
              <CardTitle className="text-sm">Academic Term Information</CardTitle>
              <CardDescription>Specify the project name and the academic term bounds.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#8A8A8A]">Project / Term Name</label>
                <Input
                  placeholder="e.g. Fall 2026 Timetable"
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
                    <option value="odd">Odd Term (Fall / Sem 1, 3, 5)</option>
                    <option value="even">Even Term (Spring / Sem 2, 4, 6)</option>
                    <option value="custom">Custom Session</option>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#8A8A8A]">Academic Year Label</label>
                  <Input
                    placeholder="e.g. 2026-2027"
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
            </CardContent>

            <CardFooter className="justify-end gap-2 border-t border-[#181818] pt-4">
              <Button
                variant="primary"
                size="sm"
                disabled={!name.trim()}
                onClick={() => setStep(2)}
                className="gap-1.5 font-mono text-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 2: Source Selection */}
        {step === 2 && (
          <Card className="bg-[#0A0A0A] border border-[#232323]">
            <CardHeader>
              <CardTitle className="text-sm">Blueprint Initialization Source</CardTitle>
              <CardDescription>Choose how the initial visual canvas should be populated.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  onClick={() => setSource('empty')}
                  className={`p-4 rounded-md border cursor-pointer transition-all ${
                    source === 'empty'
                      ? 'border-[#FACC15] bg-[#111]'
                      : 'border-[#232323] bg-[#0A0A0A] hover:border-[#8A8A8A]'
                  }`}
                >
                  <FilePlus className="w-5 h-5 text-[#FAFAFA] mb-2" />
                  <div className="text-xs font-medium text-[#FAFAFA]">Blank Canvas</div>
                  <div className="text-[11px] text-[#8A8A8A] font-mono mt-1">
                    Start with just the root institution node.
                  </div>
                </div>

                <div
                  onClick={() => setSource('institution')}
                  className={`p-4 rounded-md border cursor-pointer transition-all ${
                    source === 'institution'
                      ? 'border-[#FACC15] bg-[#111]'
                      : 'border-[#232323] bg-[#0A0A0A] hover:border-[#8A8A8A]'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-[#FAFAFA] mb-2" />
                  <div className="text-xs font-medium text-[#FAFAFA]">From Institution</div>
                  <div className="text-[11px] text-[#8A8A8A] font-mono mt-1">
                    Import existing hierarchy tree (Depts, Programs, Sections).
                  </div>
                </div>

                <div
                  onClick={() => setSource('template')}
                  className={`p-4 rounded-md border cursor-pointer transition-all ${
                    source === 'template'
                      ? 'border-[#FACC15] bg-[#111]'
                      : 'border-[#232323] bg-[#0A0A0A] hover:border-[#8A8A8A]'
                  }`}
                >
                  <Layout className="w-5 h-5 text-[#FAFAFA] mb-2" />
                  <div className="text-xs font-medium text-[#FAFAFA]">Starter Kit Template</div>
                  <div className="text-[11px] text-[#8A8A8A] font-mono mt-1">
                    Pre-packaged templates (School, College, STEM Lab).
                  </div>
                </div>
              </div>

              {source === 'template' && (
                <div className="space-y-2 pt-2 border-t border-[#181818]">
                  <label className="text-xs font-mono text-[#8A8A8A]">Select Starter Kit</label>
                  <div className="space-y-2">
                    {(templates || []).map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={`p-3 rounded border cursor-pointer transition-colors flex items-center justify-between ${
                          selectedTemplateId === t.id
                            ? 'border-[#FACC15] bg-[#111]'
                            : 'border-[#232323] hover:border-[#8A8A8A]'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium text-[#FAFAFA]">{t.name}</div>
                          <div className="text-[10px] font-mono text-[#8A8A8A]">
                            Category: {t.category} &bull; {t.subtree?.nodes?.length || 0} nodes
                          </div>
                        </div>
                        <Badge variant="neutral">v{t.version}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-between border-t border-[#181818] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                className="gap-1.5 font-mono text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={source === 'template' && !selectedTemplateId}
                onClick={() => setStep(3)}
                className="gap-1.5 font-mono text-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step 3: Schedule Settings */}
        {step === 3 && (
          <Card className="bg-[#0A0A0A] border border-[#232323]">
            <CardHeader>
              <CardTitle className="text-sm">Default Schedule Settings</CardTitle>
              <CardDescription>Configure working days, period timings, and break slots.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Days of week */}
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

              {/* Periods config */}
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
                  <label className="text-xs font-mono text-[#8A8A8A]">Duration (mins)</label>
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
                  <label className="text-xs font-mono text-[#8A8A8A]">Start Time</label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              {/* Breaks */}
              <div className="space-y-3 pt-2 border-t border-[#181818]">
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
                    <span>Add Break</span>
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
                        <span>After P</span>
                        <Input
                          type="number"
                          min={1}
                          max={periodsPerDay}
                          value={b.afterPeriod}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setBreaks((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, afterPeriod: val } : item)),
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
                              prev.map((item, i) => (i === idx ? { ...item, durationMinutes: val } : item)),
                            );
                          }}
                          className="h-8 w-16 text-xs font-mono"
                        />
                        <span>m</span>
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

            <CardFooter className="justify-between border-t border-[#181818] pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(2)}
                className="gap-1.5 font-mono text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={days.length === 0 || createMutation.isPending}
                onClick={handleFinish}
                className="gap-1.5 font-mono text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Create Project</span>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
