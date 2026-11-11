// Form component managing draft configuration, resource sections, and sticky apply actions for selected node.
'use client';

import * as React from 'react';
import {
  Check,
  AlertTriangle,
  MessageSquare,
  Users,
  DoorOpen,
  BookOpen,
  Clock,
  MoreHorizontal,
  Copy,
  CheckCheck,
  CopyCheck,
  Trash2,
  Loader2,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TYPE_ICONS } from '../canvas/node-card';
import { IssuesSummary } from './issues-summary';
import { InspectorSection } from './inspector-section';
import { ResourceRow } from './resource-row';
import { ResourcePicker, type PickerResourceItem } from './resource-picker';
import { TimesEditor, type TimesConfig } from './times-editor';
import { libraryApi } from '@/features/library/services/library.api';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { BlueprintRecommendationDto } from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Props for NodeConfigForm component. */
export interface NodeConfigFormProps {
  node: BlueprintCanvasNode;
  onUpdateConfig: (nodeId: string, data: Record<string, unknown>) => void;
  recommendations: BlueprintRecommendationDto[];
  className?: string | undefined;
}

/** React component rendering node inspector configuration tab. */
export function NodeConfigForm({
  node,
  onUpdateConfig,
  recommendations = [],
  className = '',
}: NodeConfigFormProps) {
  const setActiveCommentsNodeId = useBlueprintStore((s) => s.setActiveCommentsNodeId);
  const setImpactPreviewNode = useBlueprintStore((s) => s.setImpactPreviewNode);
  const setNodes = useBlueprintStore((s) => s.setNodes);

  const [formData, setFormData] = React.useState<Record<string, unknown>>(node.data.config || {});
  const [isDirty, setIsDirty] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState(false);

  // Accordion section open states (remembered in session)
  const nodeType = node.data.nodeType;
  const sessionKey = `slotly:inspector:sections:${nodeType}`;

  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>(() => {
    try {
      const stored = sessionStorage.getItem(sessionKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return {
      faculty: true,
      rooms: true,
      subjects: true,
      times: true,
      more: false,
    };
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => {
      const next = { ...prev, [section]: !prev[section] };
      try {
        sessionStorage.setItem(sessionKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Staged resource lists in draft
  const [stagedFaculty, setStagedFaculty] = React.useState<string[]>(() => {
    const raw = (formData['facultyIds'] as string[]) || (formData['faculty'] as string[]) || [];
    return Array.isArray(raw) ? raw : [];
  });

  const [stagedRooms, setStagedRooms] = React.useState<string[]>(() => {
    const raw = (formData['roomIds'] as string[]) || (formData['rooms'] as string[]) || [];
    return Array.isArray(raw) ? raw : [];
  });

  const [stagedSubjects, setStagedSubjects] = React.useState<string[]>(() => {
    const raw = (formData['subjectIds'] as string[]) || (formData['subjects'] as string[]) || [];
    return Array.isArray(raw) ? raw : [];
  });

  // Library data cached in component
  const [libraryFaculty, setLibraryFaculty] = React.useState<PickerResourceItem[]>([]);
  const [libraryRooms, setLibraryRooms] = React.useState<PickerResourceItem[]>([]);
  const [librarySubjects, setLibrarySubjects] = React.useState<PickerResourceItem[]>([]);

  const [activePicker, setActivePicker] = React.useState<'faculty' | 'room' | 'subject' | null>(null);
  const [isLoadingPicker, setIsLoadingPicker] = React.useState(false);

  // Field change handler
  const handleFieldChange = (field: string, val: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setIsDirty(true);
  };

  // Prefetch library data when picker opens or button hovered
  const prefetchLibrary = async (type: 'faculty' | 'room' | 'subject') => {
    try {
      if (type === 'faculty' && libraryFaculty.length === 0) {
        setIsLoadingPicker(true);
        const res = await libraryApi.listFaculty({ limit: 100 });
        setLibraryFaculty(
          res.items.map((f) => ({
            id: f.id,
            name: f.name,
            meta: `${f.designation ? `${f.designation} | ` : ''}Max: ${f.maxHoursPerWeek || 20}h/wk`,
          })),
        );
      } else if (type === 'room' && libraryRooms.length === 0) {
        setIsLoadingPicker(true);
        const res = await libraryApi.listRooms({ limit: 100 });
        setLibraryRooms(
          res.items.map((r) => ({
            id: r.id,
            name: `${r.name} (${r.code || 'Room'})`,
            meta: `Capacity: ${r.capacity} | Type: ${r.type}`,
          })),
        );
      } else if (type === 'subject' && librarySubjects.length === 0) {
        setIsLoadingPicker(true);
        const res = await libraryApi.listSubjects({ limit: 100 });
        setLibrarySubjects(
          res.items.map((s) => ({
            id: s.id,
            name: `${s.name} (${s.code || 'SUB'})`,
            meta: `Credits: ${s.credits || 3} | Weekly: ${s.weeklyHours || 3}h`,
          })),
        );
      }
    } catch {
      // handle error gracefully
    } finally {
      setIsLoadingPicker(false);
    }
  };

  const handleOpenPicker = (type: 'faculty' | 'room' | 'subject') => {
    void prefetchLibrary(type);
    setActivePicker(type);
  };

  const handleTogglePickerItem = (type: 'faculty' | 'room' | 'subject', id: string) => {
    setIsDirty(true);
    if (type === 'faculty') {
      setStagedFaculty((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        handleFieldChange('facultyIds', next);
        handleFieldChange('faculty', next);
        return next;
      });
    } else if (type === 'room') {
      setStagedRooms((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        handleFieldChange('roomIds', next);
        handleFieldChange('rooms', next);
        return next;
      });
    } else if (type === 'subject') {
      setStagedSubjects((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        handleFieldChange('subjectIds', next);
        handleFieldChange('subjects', next);
        return next;
      });
    }
  };

  const handleRemoveItem = (type: 'faculty' | 'room' | 'subject', id: string) => {
    setIsDirty(true);
    if (type === 'faculty') {
      setStagedFaculty((prev) => {
        const next = prev.filter((x) => x !== id);
        handleFieldChange('facultyIds', next);
        handleFieldChange('faculty', next);
        return next;
      });
    } else if (type === 'room') {
      setStagedRooms((prev) => {
        const next = prev.filter((x) => x !== id);
        handleFieldChange('roomIds', next);
        handleFieldChange('rooms', next);
        return next;
      });
    } else if (type === 'subject') {
      setStagedSubjects((prev) => {
        const next = prev.filter((x) => x !== id);
        handleFieldChange('subjectIds', next);
        handleFieldChange('subjects', next);
        return next;
      });
    }
  };

  // Jump to field or accordion section
  const handleJumpToField = (field: string) => {
    if (field === 'workingDays' || field === 'periodConfig' || field === 'times') {
      setOpenSections((prev) => ({ ...prev, times: true }));
      const el = document.getElementById('field-times');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (field === 'faculty' || field === 'facultyId') {
      setOpenSections((prev) => ({ ...prev, faculty: true }));
      const el = document.getElementById('field-faculty');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (field === 'room' || field === 'roomId' || field === 'roomType') {
      setOpenSections((prev) => ({ ...prev, rooms: true }));
      const el = document.getElementById('field-rooms');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else if (field === 'subject' || field === 'subjectId') {
      setOpenSections((prev) => ({ ...prev, subjects: true }));
      const el = document.getElementById('field-subjects');
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      const el = document.getElementById(`field-${field}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        el.focus();
      }
    }
  };

  // Auto-fix handler
  const handleAutoFix = () => {
    const fixed = { ...formData };
    if (!fixed['name'] && !fixed['label']) {
      fixed['name'] = node.data.label || `${nodeType.toUpperCase()}-1`;
      fixed['label'] = fixed['name'];
    }
    if ((nodeType === 'institution' || nodeType === 'department') && !fixed['code']) {
      const raw = String(fixed['name'] || nodeType);
      fixed['code'] = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'DEPT';
    }
    if (nodeType === 'program' && !fixed['durationYears']) {
      fixed['durationYears'] = 4;
    }
    if (nodeType === 'academicYear' && !fixed['yearNumber']) {
      fixed['yearNumber'] = 1;
    }
    if (nodeType === 'semester' && !fixed['number']) {
      fixed['number'] = 1;
    }
    if (nodeType === 'section' && !fixed['strength']) {
      fixed['strength'] = 60;
    }
    if (nodeType === 'batch' && !fixed['size']) {
      fixed['size'] = 30;
    }
    if (nodeType === 'institution') {
      if (!fixed['workingDays']) fixed['workingDays'] = ['mon', 'tue', 'wed', 'thu', 'fri'];
      if (!fixed['startTime']) fixed['startTime'] = '08:30';
      if (!fixed['periodDurationMinutes']) fixed['periodDurationMinutes'] = 50;
    }

    setFormData(fixed);
    setIsDirty(true);
    toast.info('Auto-fix applied to draft', 'Review changes and click Apply Changes.');
  };

  // Save handler
  const handleSave = async () => {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        facultyIds: stagedFaculty,
        roomIds: stagedRooms,
        subjectIds: stagedSubjects,
      };
      onUpdateConfig(node.id, payload);
      setIsDirty(false);
      toast.success('Changes applied', 'Node configuration saved to blueprint.');
    } catch {
      toast.error('Save failed', 'Unable to apply node changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(node.data.config || {});
    setIsDirty(false);
    const rawF = (node.data.config?.['facultyIds'] as string[]) || [];
    const rawR = (node.data.config?.['roomIds'] as string[]) || [];
    const rawS = (node.data.config?.['subjectIds'] as string[]) || [];
    setStagedFaculty(rawF);
    setStagedRooms(rawR);
    setStagedSubjects(rawS);
  };

  // Mod+Enter shortcut to save
  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      void handleSave();
    }
  };

  const handleCopyId = () => {
    void navigator.clipboard.writeText(node.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDuplicate = () => {
    const cloneId = crypto.randomUUID();
    const cloneLabel = `${String(formData['name'] || node.data.label)} (Copy)`;
    const cloneNode: BlueprintCanvasNode = {
      id: cloneId,
      type: 'blueprint',
      position: { x: node.position.x + 30, y: node.position.y + 30 },
      data: {
        ...node.data,
        label: cloneLabel,
        config: {
          ...formData,
          name: cloneLabel,
        },
      },
    };
    setNodes((prev) => [...prev, cloneNode]);
    toast.success('Node duplicated', 'Created a clone on the canvas.');
  };

  const handleDelete = () => {
    setImpactPreviewNode(node);
  };

  const NodeIcon = TYPE_ICONS[node.data.nodeType] || Sliders;
  const isComplete = node.data.effectiveStatus === 'complete';
  const missingCount = node.data.missing?.length || 0;

  // Determine section applicability per node type
  const hasFacultySection = ['institution', 'department', 'program', 'section', 'faculty'].includes(nodeType);
  const hasRoomsSection = ['institution', 'department', 'section', 'room'].includes(nodeType);
  const hasSubjectsSection = ['institution', 'department', 'program', 'section', 'subjectAssignment'].includes(nodeType);
  const hasTimesSection = ['institution', 'section'].includes(nodeType);

  return (
    <div
      className={cn('flex flex-col h-full', className)}
      onKeyDown={handleKeyDown}
    >
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm px-4 py-3 border-b border-[#232323] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <NodeIcon className="h-5 w-5 text-[#8A8A8A] shrink-0" />
          <div className="min-w-0">
            <h3 className="font-medium text-sm text-[#FAFAFA] truncate">
              {String(formData['name'] ?? formData['label'] ?? node.data.label)}
            </h3>
            <p className="font-mono text-[11px] text-[#8A8A8A] uppercase">
              {node.data.nodeType}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isComplete ? (
            <span className="font-mono text-xs text-[#8A8A8A] flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-[#22C55E]" />
              <span>Ready</span>
            </span>
          ) : (
            <span className="font-mono text-xs text-[#FACC15] flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-[#FACC15]" />
              <span>{missingCount > 0 ? `${missingCount} to fix` : 'Incomplete'}</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setActiveCommentsNodeId(node.id)}
            title="View comments"
            aria-label="View comments"
            className="h-7 w-7 rounded-[6px] text-[#8A8A8A] hover:text-[#FAFAFA] hover:bg-[#181818] flex items-center justify-center transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Scrolling Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Issues Summary Banner */}
        <IssuesSummary
          node={node}
          onAutoFix={handleAutoFix}
          onJumpToField={handleJumpToField}
        />

        {/* Smart Recommendations */}
        {recommendations.length > 0 && (
          <div className="p-2.5 rounded-[12px] bg-[#141414] border border-[#232323] space-y-2">
            <span className="text-[11px] font-semibold text-[#FAFAFA] flex items-center gap-1.5">
              <span>Suggestions ({recommendations.length})</span>
            </span>
            <div className="space-y-1.5">
              {recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="text-xs p-2 rounded-[8px] bg-[#111111] border border-[#232323] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#FAFAFA] truncate">{rec.title}</p>
                    <p className="text-[10px] text-[#8A8A8A] font-mono truncate">{rec.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Fields Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5 flex items-center justify-between">
              <span>Name / Label</span>
              <span className="text-xs text-[#8A8A8A]">Required</span>
            </label>
            <input
              id="field-name"
              type="text"
              value={String(formData['name'] ?? formData['label'] ?? '')}
              onChange={(e) => {
                handleFieldChange('name', e.target.value);
                handleFieldChange('label', e.target.value);
              }}
              placeholder="e.g. Computer Science & Eng."
              className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs text-[#FAFAFA] placeholder:text-[#666666] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
            />
          </div>

          {(nodeType === 'institution' || nodeType === 'department') && (
            <div>
              <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5 flex items-center justify-between">
                <span>Code</span>
                <span className="text-xs text-[#8A8A8A]">Required</span>
              </label>
              <input
                id="field-code"
                type="text"
                value={String(formData['code'] ?? '')}
                onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
                placeholder="e.g. CSE"
                className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] placeholder:text-[#666666] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
              />
            </div>
          )}

          {nodeType === 'program' && (
            <div>
              <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5 flex items-center justify-between">
                <span>Duration (Years)</span>
                <span className="text-xs text-[#8A8A8A]">Required</span>
              </label>
              <input
                id="field-durationYears"
                type="number"
                min={1}
                max={6}
                value={Number(formData['durationYears'] ?? 4)}
                onChange={(e) => handleFieldChange('durationYears', parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
              />
            </div>
          )}

          {nodeType === 'academicYear' && (
            <div>
              <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5 flex items-center justify-between">
                <span>Year Number</span>
                <span className="text-xs text-[#8A8A8A]">Required</span>
              </label>
              <input
                id="field-yearNumber"
                type="number"
                min={1}
                max={6}
                value={Number(formData['yearNumber'] ?? 1)}
                onChange={(e) => handleFieldChange('yearNumber', parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
              />
            </div>
          )}

          {nodeType === 'semester' && (
            <>
              <div>
                <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5 flex items-center justify-between">
                  <span>Semester Number</span>
                  <span className="text-xs text-[#8A8A8A]">Required</span>
                </label>
                <input
                  id="field-number"
                  type="number"
                  min={1}
                  max={12}
                  value={Number(formData['number'] ?? 1)}
                  onChange={(e) => handleFieldChange('number', parseInt(e.target.value, 10))}
                  className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={String(formData['startDate'] ?? '')}
                    onChange={(e) => handleFieldChange('startDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5">End Date</label>
                  <input
                    type="date"
                    value={String(formData['endDate'] ?? '')}
                    onChange={(e) => handleFieldChange('endDate', e.target.value)}
                    className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
                  />
                </div>
              </div>
            </>
          )}

          {nodeType === 'section' && (
            <div>
              <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5 flex items-center justify-between">
                <span>Student Strength</span>
                <span className="text-xs text-[#8A8A8A]">Required</span>
              </label>
              <input
                id="field-strength"
                type="number"
                min={1}
                value={Number(formData['strength'] ?? 60)}
                onChange={(e) => handleFieldChange('strength', parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
              />
              <p className="font-mono text-[11px] text-[#8A8A8A] mt-1">
                Sum of child batch sizes cannot exceed this capacity.
              </p>
            </div>
          )}

          {nodeType === 'batch' && (
            <div>
              <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5 flex items-center justify-between">
                <span>Batch Size</span>
                <span className="text-xs text-[#8A8A8A]">Required</span>
              </label>
              <input
                id="field-size"
                type="number"
                min={1}
                value={Number(formData['size'] ?? 30)}
                onChange={(e) => handleFieldChange('size', parseInt(e.target.value, 10))}
                className="w-full h-10 px-3 rounded-[12px] bg-[#111111] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA]"
              />
            </div>
          )}
        </div>

        {/* Resource Sections (Accordion) */}
        <div className="pt-2 border-t border-[#232323] space-y-0">
          {/* Faculty Section */}
          {hasFacultySection && (
            <div id="field-faculty">
              <InspectorSection
                id="faculty"
                title="Faculty"
                icon={Users}
                count={stagedFaculty.length}
                isOpen={Boolean(openSections['faculty'])}
                onToggle={() => toggleSection('faculty')}
                onAdd={() => handleOpenPicker('faculty')}
                addTooltip="Assign faculty"
                hasIssues={node.data.missing?.some((m) => (typeof m === 'string' ? m : m.field).includes('faculty'))}
              >
                {activePicker === 'faculty' && (
                  <ResourcePicker
                    isOpen={true}
                    onClose={() => setActivePicker(null)}
                    title="Faculty"
                    resourceType="faculty"
                    items={libraryFaculty}
                    selectedIds={stagedFaculty}
                    onToggleItem={(id) => handleTogglePickerItem('faculty', id)}
                    isLoading={isLoadingPicker}
                  />
                )}

                {stagedFaculty.length === 0 ? (
                  <p className="text-xs text-[#8A8A8A] font-mono py-1">
                    No faculty assigned to this node yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {stagedFaculty.map((fid) => {
                      const item = libraryFaculty.find((f) => f.id === fid);
                      const name = item?.name || `Faculty (${fid.slice(0, 8)})`;
                      return (
                        <ResourceRow
                          key={fid}
                          id={fid}
                          name={name}
                          meta={item?.meta}
                          resourceType="faculty"
                          onRemove={(id) => handleRemoveItem('faculty', id)}
                        />
                      );
                    })}
                  </div>
                )}
              </InspectorSection>
            </div>
          )}

          {/* Rooms Section */}
          {hasRoomsSection && (
            <div id="field-rooms">
              <InspectorSection
                id="rooms"
                title="Rooms"
                icon={DoorOpen}
                count={stagedRooms.length}
                isOpen={Boolean(openSections['rooms'])}
                onToggle={() => toggleSection('rooms')}
                onAdd={() => handleOpenPicker('room')}
                addTooltip="Assign room"
                hasIssues={node.data.missing?.some((m) => (typeof m === 'string' ? m : m.field).includes('room'))}
              >
                {activePicker === 'room' && (
                  <ResourcePicker
                    isOpen={true}
                    onClose={() => setActivePicker(null)}
                    title="Rooms"
                    resourceType="room"
                    items={libraryRooms}
                    selectedIds={stagedRooms}
                    onToggleItem={(id) => handleTogglePickerItem('room', id)}
                    isLoading={isLoadingPicker}
                  />
                )}

                {stagedRooms.length === 0 ? (
                  <p className="text-xs text-[#8A8A8A] font-mono py-1">
                    No rooms assigned to this node yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {stagedRooms.map((rid) => {
                      const item = libraryRooms.find((r) => r.id === rid);
                      const name = item?.name || `Room (${rid.slice(0, 8)})`;
                      return (
                        <ResourceRow
                          key={rid}
                          id={rid}
                          name={name}
                          meta={item?.meta}
                          resourceType="room"
                          onRemove={(id) => handleRemoveItem('room', id)}
                        />
                      );
                    })}
                  </div>
                )}
              </InspectorSection>
            </div>
          )}

          {/* Subjects Section */}
          {hasSubjectsSection && (
            <div id="field-subjects">
              <InspectorSection
                id="subjects"
                title="Subjects"
                icon={BookOpen}
                count={stagedSubjects.length}
                isOpen={Boolean(openSections['subjects'])}
                onToggle={() => toggleSection('subjects')}
                onAdd={() => handleOpenPicker('subject')}
                addTooltip="Assign subject"
                hasIssues={node.data.missing?.some((m) => (typeof m === 'string' ? m : m.field).includes('subject'))}
              >
                {activePicker === 'subject' && (
                  <ResourcePicker
                    isOpen={true}
                    onClose={() => setActivePicker(null)}
                    title="Subjects"
                    resourceType="subject"
                    items={librarySubjects}
                    selectedIds={stagedSubjects}
                    onToggleItem={(id) => handleTogglePickerItem('subject', id)}
                    isLoading={isLoadingPicker}
                  />
                )}

                {stagedSubjects.length === 0 ? (
                  <p className="text-xs text-[#8A8A8A] font-mono py-1">
                    No subjects assigned to this node yet.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {stagedSubjects.map((sid) => {
                      const item = librarySubjects.find((s) => s.id === sid);
                      const name = item?.name || `Subject (${sid.slice(0, 8)})`;
                      return (
                        <ResourceRow
                          key={sid}
                          id={sid}
                          name={name}
                          meta={item?.meta}
                          resourceType="subject"
                          onRemove={(id) => handleRemoveItem('subject', id)}
                        />
                      );
                    })}
                  </div>
                )}
              </InspectorSection>
            </div>
          )}

          {/* Times Section */}
          {hasTimesSection && (
            <div id="field-times">
              <InspectorSection
                id="times"
                title="Times"
                icon={Clock}
                isOpen={Boolean(openSections['times'])}
                onToggle={() => toggleSection('times')}
                hasIssues={node.data.missing?.some((m) => {
                  const f = typeof m === 'string' ? m : m.field;
                  return f === 'workingDays' || f === 'periodConfig';
                })}
              >
                <TimesEditor
                  config={{
                    workingDays: (formData['workingDays'] as string[]) || ['mon', 'tue', 'wed', 'thu', 'fri'],
                    startTime: (formData['startTime'] as string) || '08:30',
                    periodDurationMinutes: (formData['periodDurationMinutes'] as number) || 50,
                    periodsPerDay: (formData['periodsPerDay'] as number) || 6,
                  }}
                  onChange={(updated: Partial<TimesConfig>) => {
                    setFormData((prev) => ({ ...prev, ...updated }));
                    setIsDirty(true);
                  }}
                />
              </InspectorSection>
            </div>
          )}

          {/* More Section */}
          <InspectorSection
            id="more"
            title="More"
            icon={MoreHorizontal}
            isOpen={Boolean(openSections['more'])}
            onToggle={() => toggleSection('more')}
          >
            <div className="space-y-3">
              <div>
                <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5">
                  Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={String(formData['description'] ?? '')}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  placeholder="Optional notes or details..."
                  className="w-full p-2 rounded-[10px] bg-[#111111] border border-[#232323] text-xs text-[#FAFAFA] placeholder:text-[#666666] focus:outline-none focus:ring-1 focus:ring-[#FAFAFA] resize-none"
                />
              </div>

              <div>
                <label className="block text-[13px] font-medium text-[#FAFAFA] mb-1.5">Node ID</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={node.id}
                    className="flex-1 h-9 px-2.5 rounded-[8px] bg-[#111111] border border-[#232323] text-[11px] font-mono text-[#8A8A8A]"
                  />
                  <button
                    type="button"
                    onClick={handleCopyId}
                    aria-label="Copy node ID"
                    title="Copy node ID"
                    className="h-9 w-9 rounded-[8px] border border-[#232323] bg-[#141414] hover:bg-[#1F1F1F] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center transition-colors"
                  >
                    {copiedId ? <CheckCheck className="h-4 w-4 text-[#22C55E]" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#232323] space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDuplicate}
                  className="w-full h-9 text-xs font-medium gap-1.5 border-[#383838] hover:border-[#FAFAFA] text-[#FAFAFA] bg-[#111111]"
                >
                  <CopyCheck className="h-3.5 w-3.5" />
                  <span>Duplicate Node</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="w-full h-9 text-xs font-medium gap-1.5 border-[#EF4444]/30 hover:border-[#EF4444] text-[#EF4444] bg-[#160D0D] hover:bg-[#201010]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Node</span>
                </Button>
              </div>
            </div>
          </InspectorSection>
        </div>
      </div>

      {/* Sticky Footer (64px) */}
      <div className="sticky bottom-0 z-10 h-16 bg-[#0A0A0A]/95 backdrop-blur-sm px-4 border-t border-[#232323] flex items-center justify-between">
        <div>
          {isDirty && (
            <span className="text-[13px] font-mono text-[#8A8A8A]">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
            disabled={!isDirty || isSaving}
            className="h-10 px-3 text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] disabled:opacity-30"
          >
            Reset
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="h-10 px-4 rounded-[12px] font-medium text-xs bg-[#FAFAFA] hover:bg-[#FAFAFA]/90 text-[#000000] disabled:opacity-40 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FAFAFA]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5 stroke-[3]" />
                <span>Apply Changes</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
