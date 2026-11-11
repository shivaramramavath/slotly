// Schema-driven node configuration form supporting autosave, field validation, resource blocks, assignments, and rules.
'use client';

import * as React from 'react';
import {
  Check,
  AlertTriangle,
  RotateCcw,
  Sliders,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useBlueprintStore } from '../../store/blueprint.store';
import { toast } from '@/components/ui/toast';
import { getNodeFormConfig } from './node-form-registry';
import { ResourceBlock } from './resource-block';
import { AssignmentsBlock, type AssignmentRowItem } from './assignments-block';
import { BlueprintConstraintsTab } from './tabs/blueprint-constraints-tab';
import { TimesEditor } from './times-editor';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { BlueprintRecommendationDto } from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Props for NodeConfigForm component. */
export interface NodeConfigFormProps {
  node: BlueprintCanvasNode;
  onUpdateConfig: (nodeId: string, data: Record<string, unknown>) => void;
  recommendations?: BlueprintRecommendationDto[] | undefined;
  className?: string | undefined;
}

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
];

/** React component rendering schema-driven node configuration form. */
export function NodeConfigForm({
  node,
  onUpdateConfig,
  className = '',
}: NodeConfigFormProps) {
  const nodes = useBlueprintStore((s) => s.nodes);
  const selectNode = useBlueprintStore((s) => s.selectNode);

  const nodeType = node.data.nodeType;
  const formConfig = React.useMemo(() => getNodeFormConfig(nodeType), [nodeType]);

  const [formData, setFormData] = React.useState<Record<string, unknown>>(() => {
    return {
      name: node.data.label,
      ...(node.data.config || {}),
    };
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [savedFields, setSavedFields] = React.useState<Record<string, boolean>>({});
  const [isRulesExpanded, setIsRulesExpanded] = React.useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Provenance / inheritance info
  const inheritedFrom = (node.data.config?._inheritedFrom as {
    parentId: string;
    parentLabel: string;
    parentType: string;
  }) || undefined;

  const parentNode = React.useMemo(() => {
    if (inheritedFrom?.parentId) {
      return nodes.find((n) => n.id === inheritedFrom.parentId);
    }
    if (node.data.parentId) {
      return nodes.find((n) => n.id === node.data.parentId);
    }
    return undefined;
  }, [inheritedFrom, node.data.parentId, nodes]);

  const parentConfig = (parentNode?.data.config || {}) as Record<string, unknown>;

  // Check field inheritance state
  const getFieldInheritanceState = (fieldKey: string) => {
    if (!parentNode) return null;
    const parentVal = parentConfig[fieldKey];
    if (parentVal === undefined) return null;

    const currentVal = formData[fieldKey];
    const isOverridden = JSON.stringify(currentVal) !== JSON.stringify(parentVal);
    return {
      parentName: parentNode.data.label,
      parentId: parentNode.id,
      isOverridden,
      parentVal,
    };
  };

  const handleResetToInherited = (fieldKey: string, parentVal: unknown) => {
    handleFieldChange(fieldKey, parentVal);
    toast.info('Restored to inherited', `Reset ${fieldKey} to parent value.`);
  };

  // Validate form state
  const validateField = (key: string, value: unknown, allData: Record<string, unknown>) => {
    const parseRes = formConfig.schema.safeParse({ ...allData, [key]: value });
    if (!parseRes.success) {
      const fieldIssue = parseRes.error.issues.find((issue) => issue.path[0] === key);
      return fieldIssue ? fieldIssue.message : undefined;
    }
    return undefined;
  };

  // Autosave triggering function
  const triggerAutosave = React.useCallback(
    (nextData: Record<string, unknown>, keyChanged?: string) => {
      // Validate full schema before autosave
      const parseRes = formConfig.schema.safeParse(nextData);
      if (!parseRes.success) {
        const newErrors: Record<string, string> = {};
        parseRes.error.issues.forEach((iss) => {
          const path = String(iss.path[0]);
          newErrors[path] = iss.message;
        });
        setErrors(newErrors);
        return;
      }

      setErrors({});
      onUpdateConfig(node.id, nextData);

      if (keyChanged) {
        setSavedFields((prev) => ({ ...prev, [keyChanged]: true }));
        setTimeout(() => {
          setSavedFields((prev) => ({ ...prev, [keyChanged]: false }));
        }, 1500);
      }
    },
    [formConfig.schema, node.id, onUpdateConfig],
  );

  // Field change handler with debouncing (~400ms pause)
  const handleFieldChange = (key: string, value: unknown) => {
    const nextData = { ...formData, [key]: value };
    setFormData(nextData);

    // Validate single field immediately for UI error
    const err = validateField(key, value, nextData);
    if (err) {
      setErrors((prev) => ({ ...prev, [key]: err }));
    } else {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      triggerAutosave(nextData, key);
    }, 400);
  };

  // Immediate save on blur
  const handleFieldBlur = (key: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    triggerAutosave(formData, key);
  };

  // Pool update handler
  const handleUpdatePool = (
    resourceType: 'faculty' | 'subject' | 'room',
    payload: {
      additions?: string[];
      exclusions?: string[];
      required?: string[];
      pinned?: string[];
    },
  ) => {
    const currentAdditions =
      ((formData['poolAdditions'] as Record<string, string[]>) || {})[resourceType] || [];
    const currentExclusions =
      ((formData['poolExclusions'] as Record<string, string[]>) || {})[resourceType] || [];
    const currentRequired =
      ((formData['poolRequired'] as Record<string, string[]>) || {})[resourceType] || [];
    const currentPinned =
      ((formData['poolPinned'] as Record<string, string[]>) || {})[resourceType] || [];

    const nextAdditions = {
      ...((formData['poolAdditions'] as Record<string, string[]>) || {}),
      [resourceType]: payload.additions ?? currentAdditions,
    };
    const nextExclusions = {
      ...((formData['poolExclusions'] as Record<string, string[]>) || {}),
      [resourceType]: payload.exclusions ?? currentExclusions,
    };
    const nextRequired = {
      ...((formData['poolRequired'] as Record<string, string[]>) || {}),
      [resourceType]: payload.required ?? currentRequired,
    };
    const nextPinned = {
      ...((formData['poolPinned'] as Record<string, string[]>) || {}),
      [resourceType]: payload.pinned ?? currentPinned,
    };

    const nextData: Record<string, unknown> = {
      ...formData,
      [`${resourceType}Ids`]: payload.additions ?? currentAdditions,
      poolAdditions: nextAdditions,
      poolExclusions: nextExclusions,
      poolRequired: nextRequired,
      poolPinned: nextPinned,
    };

    setFormData(nextData);
    onUpdateConfig(node.id, nextData);
  };

  // Assignments update handler
  const handleUpdateAssignments = (assignments: AssignmentRowItem[]) => {
    const nextData = {
      ...formData,
      assignments,
    };
    setFormData(nextData);
    onUpdateConfig(node.id, nextData);
  };

  // AutoFill mode update
  const handleAutoFillModeChange = (mode: string) => {
    const nextData = {
      ...formData,
      defaultAutoFillMode: mode,
      autoFillMode: mode,
    };
    setFormData(nextData);
    onUpdateConfig(node.id, nextData);
    toast.info('Auto-fill updated', `Borrow policy set to ${mode}.`);
  };

  // Extract available pool IDs for Section classTeacher / homeRoom / batch lab subjects
  const effectiveFacultyIds =
    (formData['facultyIds'] as string[]) ||
    ((formData['poolAdditions'] as Record<string, string[]>)?.['faculty'] ?? []);
  const effectiveRoomIds =
    (formData['roomIds'] as string[]) ||
    ((formData['poolAdditions'] as Record<string, string[]>)?.['room'] ?? []);
  const effectiveSubjectIds =
    (formData['subjectIds'] as string[]) ||
    ((formData['poolAdditions'] as Record<string, string[]>)?.['subject'] ?? []);

  return (
    <div className={cn('p-4 space-y-6 text-xs text-[#FAFAFA] select-none', className)}>
      {/* Read-only Context Badges */}
      {nodeType === 'program' && parentNode && (
        <div className="p-2.5 rounded-[8px] bg-[#141414] border border-[#232323] flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#8A8A8A]">Parent Department:</span>
          <button
            type="button"
            onClick={() => selectNode(parentNode.id)}
            className="text-[#FAFAFA] hover:underline font-medium"
          >
            {parentNode.data.label}
          </button>
        </div>
      )}

      {nodeType === 'batch' && parentNode && (
        <div className="p-2.5 rounded-[8px] bg-[#141414] border border-[#232323] flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#8A8A8A]">Parent Section:</span>
          <span className="text-[#FAFAFA] font-medium">{parentNode.data.label}</span>
        </div>
      )}

      {/* Schema-Driven Configuration Fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-xs text-[#8A8A8A] uppercase tracking-wider font-mono">
            Configuration
          </span>
        </div>

        {formConfig.fieldKeys.map((key) => {
          const meta = formConfig.fieldMeta[key];
          if (!meta) return null;

          const errorMsg = errors[key];
          const isSaved = savedFields[key];
          const inh = getFieldInheritanceState(key);
          const inputId = `field_${node.id}_${key}`;

          return (
            <div key={key} className="space-y-1.5">
              {/* Field Label & Inheritance Marker */}
              <div className="flex items-center justify-between">
                <label
                  htmlFor={inputId}
                  className="text-xs font-medium text-[#FAFAFA] flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{meta.label}</span>
                  {meta.required && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" title="Required field" />
                  )}
                </label>

                <div className="flex items-center gap-1.5">
                  {/* Saved Tick */}
                  {isSaved && (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-[#22C55E]">
                      <Check className="h-3 w-3" />
                      <span>Saved</span>
                    </span>
                  )}

                  {/* Inheritance Pill */}
                  {inh && (
                    <div className="flex items-center gap-1 font-mono text-[9px]">
                      {inh.isOverridden ? (
                        <>
                          <span className="px-1.5 py-0.2 rounded bg-[#2A1E10] text-[#FACC15] border border-[#4A3515]">
                            Overridden
                          </span>
                          <button
                            type="button"
                            onClick={() => handleResetToInherited(key, inh.parentVal)}
                            title={`Reset to ${inh.parentName} value`}
                            className="h-4 w-4 rounded hover:bg-[#1C1C1C] text-[#8A8A8A] hover:text-[#FAFAFA] flex items-center justify-center transition-colors"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => selectNode(inh.parentId)}
                          title={`Inherited from ${inh.parentName}. Click to select parent.`}
                          className="px-1.5 py-0.2 rounded bg-[#181818] text-[#8A8A8A] hover:text-[#FAFAFA] border border-[#282828] truncate max-w-[100px]"
                        >
                          From {inh.parentName}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Field Components based on kind */}
              {meta.kind === 'text' && (
                <input
                  id={inputId}
                  type="text"
                  value={String(formData[key] ?? '')}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  onBlur={() => handleFieldBlur(key)}
                  placeholder={meta.hint}
                  className={cn(
                    'w-full h-8 px-2.5 rounded-[8px] bg-[#141414] border text-xs text-[#FAFAFA] focus-visible:outline-none transition-colors',
                    errorMsg
                      ? 'border-[#EF4444] focus:border-[#EF4444]'
                      : 'border-[#232323] hover:border-[#333333] focus:border-[#FAFAFA]',
                  )}
                />
              )}

              {meta.kind === 'number' && (
                <div className="relative">
                  <input
                    id={inputId}
                    type="number"
                    value={formData[key] !== undefined && formData[key] !== null ? Number(formData[key]) : ''}
                    onChange={(e) =>
                      handleFieldChange(key, e.target.value === '' ? undefined : Number(e.target.value))
                    }
                    onBlur={() => handleFieldBlur(key)}
                    placeholder={meta.hint}
                    className={cn(
                      'w-full h-8 px-2.5 rounded-[8px] bg-[#141414] border text-xs text-[#FAFAFA] font-mono focus-visible:outline-none transition-colors',
                      errorMsg
                        ? 'border-[#EF4444] focus:border-[#EF4444]'
                        : 'border-[#232323] hover:border-[#333333] focus:border-[#FAFAFA]',
                    )}
                  />
                  {key === 'periodLength' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#8A8A8A]">
                      min
                    </span>
                  )}
                  {key === 'durationYears' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#8A8A8A]">
                      years
                    </span>
                  )}
                  {key === 'periodsPerDay' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#8A8A8A]">
                      slots
                    </span>
                  )}
                </div>
              )}

              {meta.kind === 'select' && (
                <select
                  id={inputId}
                  value={String(formData[key] ?? '')}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  onBlur={() => handleFieldBlur(key)}
                  className="w-full h-8 px-2.5 rounded-[8px] bg-[#141414] border border-[#232323] hover:border-[#333333] focus:border-[#FAFAFA] text-xs text-[#FAFAFA] focus-visible:outline-none transition-colors"
                >
                  {key === 'defaultAutoFillMode' ? (
                    <>
                      <option value="same_department">Same Department Only</option>
                      <option value="allow_other_departments">Allow Cross-Department</option>
                      <option value="off">Off (Manual)</option>
                    </>
                  ) : key === 'degreeLevel' ? (
                    <>
                      <option value="">Select Degree Level...</option>
                      <option value="diploma">Diploma</option>
                      <option value="undergraduate">Undergraduate</option>
                      <option value="postgraduate">Postgraduate</option>
                      <option value="doctorate">Doctorate</option>
                    </>
                  ) : null}
                </select>
              )}

              {meta.kind === 'combobox' && (
                <select
                  id={inputId}
                  value={String(formData[key] ?? '')}
                  onChange={(e) => handleFieldChange(key, e.target.value || undefined)}
                  onBlur={() => handleFieldBlur(key)}
                  className="w-full h-8 px-2.5 rounded-[8px] bg-[#141414] border border-[#232323] hover:border-[#333333] focus:border-[#FAFAFA] text-xs text-[#FAFAFA] focus-visible:outline-none transition-colors"
                >
                  <option value="">Unassigned</option>
                  {(key === 'classTeacherId' || key === 'headOfDepartmentId'
                    ? effectiveFacultyIds
                    : key === 'homeRoomId'
                      ? effectiveRoomIds
                      : effectiveSubjectIds
                  ).map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              )}

              {meta.kind === 'dayChips' && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const currentDays = (formData[key] as number[]) || [];
                    const isSelected = currentDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => {
                          const next = isSelected
                            ? currentDays.filter((d) => d !== day.value)
                            : [...currentDays, day.value].sort();
                          handleFieldChange(key, next);
                        }}
                        className={cn(
                          'h-7 px-2.5 rounded-[6px] text-xs font-mono border transition-colors',
                          isSelected
                            ? 'bg-[#FAFAFA] text-black border-[#FAFAFA] font-medium'
                            : 'bg-[#141414] text-[#8A8A8A] border-[#232323] hover:text-[#FAFAFA]',
                        )}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {meta.kind === 'timeInput' && (
                <input
                  id={inputId}
                  type="time"
                  value={String(formData[key] ?? '08:00')}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  onBlur={() => handleFieldBlur(key)}
                  className="w-full h-8 px-2.5 rounded-[8px] bg-[#141414] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:border-[#FAFAFA] focus-visible:outline-none"
                />
              )}

              {meta.kind === 'dateRange' && (
                <input
                  id={inputId}
                  type="date"
                  value={String(formData[key] ?? '')}
                  onChange={(e) => handleFieldChange(key, e.target.value)}
                  onBlur={() => handleFieldBlur(key)}
                  className="w-full h-8 px-2.5 rounded-[8px] bg-[#141414] border border-[#232323] text-xs font-mono text-[#FAFAFA] focus:border-[#FAFAFA] focus-visible:outline-none"
                />
              )}

              {meta.kind === 'breakList' && (
                <TimesEditor
                  config={{
                    workingDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
                    startTime: String(formData['startTime'] || '08:00'),
                    periodDurationMinutes: Number(formData['periodLength'] || 50),
                    periodsPerDay: Number(formData['periodsPerDay'] || 7),
                    breaks:
                      (formData['breaks'] as Array<{
                        id: string;
                        name: string;
                        afterPeriod: number;
                        durationMinutes: number;
                      }>) || [],
                  }}
                  onChange={(updatedTimes) => {
                    handleFieldChange('breaks', updatedTimes.breaks);
                  }}
                />
              )}

              {/* Inline Error Message */}
              {errorMsg && (
                <p className="text-[11px] font-mono text-[#EF4444] flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>{errorMsg}</span>
                </p>
              )}

              {/* Helper text */}
              {meta.hint && !errorMsg && (
                <p className="text-[10px] font-mono text-[#666666]">{meta.hint}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Resource Blocks Section */}
      <div className="space-y-4 pt-2 border-t border-[#232323]">
        <div className="flex items-center justify-between">
          <span className="font-medium text-xs text-[#8A8A8A] uppercase tracking-wider font-mono">
            Resource Pools
          </span>
        </div>

        <ResourceBlock
          node={node}
          projectId={node.data.refId || 'current'}
          resourceType="faculty"
          title="Faculty Pool"
          onUpdatePool={(p) => handleUpdatePool('faculty', p)}
        />

        <ResourceBlock
          node={node}
          projectId={node.data.refId || 'current'}
          resourceType="subject"
          title="Subjects Pool"
          onUpdatePool={(p) => handleUpdatePool('subject', p)}
        />

        <ResourceBlock
          node={node}
          projectId={node.data.refId || 'current'}
          resourceType="room"
          title="Rooms Pool"
          onUpdatePool={(p) => handleUpdatePool('room', p)}
        />
      </div>

      {/* Subject Assignments for Section and Batch */}
      {(nodeType === 'section' || nodeType === 'batch') && (
        <div className="pt-2 border-t border-[#232323]">
          <AssignmentsBlock
            node={node}
            projectId={node.data.refId || 'current'}
            onUpdateAssignments={handleUpdateAssignments}
          />
        </div>
      )}

      {/* Collapsed Rules Section */}
      <div className="pt-2 border-t border-[#232323]">
        <button
          type="button"
          onClick={() => setIsRulesExpanded(!isRulesExpanded)}
          className="w-full flex items-center justify-between py-2 text-xs font-mono text-[#8A8A8A] hover:text-[#FAFAFA] transition-colors"
        >
          <div className="flex items-center gap-1.5 font-medium uppercase tracking-wider">
            <Sliders className="h-3.5 w-3.5 text-[#FACC15]" />
            <span>Rules & Overrides</span>
          </div>
          {isRulesExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </button>

        {isRulesExpanded && (
          <div className="pt-2 space-y-4 animate-in fade-in-0">
            {/* AutoFill Policy Setting */}
            <div className="p-3 rounded-[8px] bg-[#141414] border border-[#232323] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-xs text-[#FAFAFA]">Auto-fill Borrow Policy</span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-[#1C1C1C] text-[#8A8A8A] border border-[#282828]">
                  Inherited
                </span>
              </div>
              <p className="text-[11px] text-[#8A8A8A]">
                Controls whether solver can borrow rooms or faculty from other departments.
              </p>
              <select
                value={String(formData['defaultAutoFillMode'] || formData['autoFillMode'] || 'same_department')}
                onChange={(e) => handleAutoFillModeChange(e.target.value)}
                className="w-full h-8 px-2.5 rounded bg-[#1A1A1A] border border-[#2B2B2B] text-xs text-[#FAFAFA] focus:border-[#FAFAFA] focus-visible:outline-none"
              >
                <option value="same_department">Same Department Only</option>
                <option value="allow_other_departments">Allow Cross-Department Borrow</option>
                <option value="off">Off (Manual Only)</option>
              </select>
            </div>

            {/* Embedded Constraints Tab Overrides */}
            <div className="p-3 rounded-[8px] bg-[#141414] border border-[#232323]">
              <BlueprintConstraintsTab projectId={node.data.refId || 'current'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
