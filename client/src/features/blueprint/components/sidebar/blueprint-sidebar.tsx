'use client';

import { useState, useEffect } from 'react';
import {
  Sliders,
  Sparkles,
  ShieldCheck,
  Check,
  MessageSquare,
  Wand2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { useBlueprintStore } from '../../store/blueprint.store';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { BlueprintRecommendationDto } from '@slotly/contracts';

interface BlueprintSidebarProps {
  projectId: string;
  onUpdateConfig: (nodeId: string, data: Record<string, unknown>) => void;
}

interface NodeConfigFormProps {
  node: BlueprintCanvasNode;
  onUpdateConfig: (nodeId: string, data: Record<string, unknown>) => void;
  recommendations: BlueprintRecommendationDto[];
}

function NodeConfigForm({ node, onUpdateConfig, recommendations }: NodeConfigFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(node.data.config || {});
  const [isDirty, setIsDirty] = useState(false);
  const fixHint = useBlueprintStore((s) => s.fixHint);

  const handleFieldChange = (field: string, val: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdateConfig(node.id, formData);
    setIsDirty(false);
  };

  const handleReset = () => {
    setFormData(node.data.config || {});
    setIsDirty(false);
  };

  const handleApplyRecommendation = (rec: BlueprintRecommendationDto) => {
    if (rec.type === 'faculty') {
      const facultyName = rec.title.replace(/^Faculty Suggestion:\s*/i, '');
      handleFieldChange('facultyName', facultyName);
    } else if (rec.type === 'room') {
      const roomName = rec.title.replace(/^Room Suggestion:\s*/i, '');
      handleFieldChange('roomName', roomName);
    }
  };

  const handleAutoFix = () => {
    const fixed = { ...formData };
    const nodeType = node.data.nodeType;

    if (!fixed['name'] && !fixed['label']) {
      fixed['name'] = node.data.label || `${nodeType.toUpperCase()}-1`;
      fixed['label'] = fixed['name'];
    }

    if (nodeType === 'institution' || nodeType === 'department') {
      if (!fixed['code']) {
        const raw = String(fixed['name'] || nodeType);
        fixed['code'] = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() || 'DEPT';
      }
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

    if (nodeType === 'subjectAssignment') {
      if (!fixed['weeklyHours']) fixed['weeklyHours'] = 3;
      if (!fixed['type']) fixed['type'] = 'theory';
    }

    if (nodeType === 'room') {
      if (!fixed['capacity']) fixed['capacity'] = 60;
      if (!fixed['type']) fixed['type'] = 'lecture';
    }

    setFormData(fixed);
    onUpdateConfig(node.id, fixed);
    setIsDirty(false);
  };

  const nodeType = node.data.nodeType;
  const missingCount = node.data.missing?.length || 0;

  return (
    <div className="space-y-4 py-2">
      {/* Smart Help / Auto Fix Banner if node is incomplete */}
      {missingCount > 0 && (
        <div className="p-2.5 rounded bg-[#161616] border border-[#FACC15]/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-[#FACC15] flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {missingCount} missing requirement{missingCount > 1 ? 's' : ''}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoFix}
              className="h-6 px-2 text-[10px] gap-1 border-[#FACC15]/40 text-[#FACC15] hover:bg-[#FACC15]/10"
            >
              <Wand2 className="h-2.5 w-2.5" />
              <span>Fix automatically</span>
            </Button>
          </div>
          <div className="flex flex-wrap gap-1">
            {node.data.missing?.map((item, idx) => {
              const fieldName = typeof item === 'string' ? item : item.field;
              return (
                <span
                  key={`${fieldName}-${idx}`}
                  className="font-mono text-[9px] bg-[#111111] text-[#8A8A8A] px-1.5 py-0.5 rounded border border-[#232323]"
                >
                  missing: {fieldName}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations Chips */}
      {recommendations.length > 0 && (
        <div className="p-2.5 rounded bg-[#111111] border border-[#232323] space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#FAFAFA]">
            <Lightbulb className="h-3.5 w-3.5 text-[#FACC15]" />
            <span>Smart Recommendations</span>
          </div>
          <div className="space-y-1.5">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="text-[11px] p-2 rounded bg-[#161616] border border-[#232323] hover:border-[#FACC15]/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[#FAFAFA]">{rec.title}</span>
                  {(rec.type === 'faculty' || rec.type === 'room') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleApplyRecommendation(rec)}
                      className="h-5 px-1.5 text-[10px] text-[#FACC15] hover:text-[#FAFAFA]"
                    >
                      Apply
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-[#8A8A8A] font-mono leading-tight">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Field: Name / Label */}
      <div>
        <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
          Name / Label <span className="text-[#EF4444]">*</span>
        </label>
        <Input
          value={String(formData['name'] ?? formData['label'] ?? '')}
          onChange={(e) => {
            handleFieldChange('name', e.target.value);
            handleFieldChange('label', e.target.value);
          }}
          placeholder="e.g. Computer Science & Eng."
          className={
            fixHint?.field === 'name' || fixHint?.field === 'label'
              ? 'border-[#FACC15] ring-1 ring-[#FACC15]'
              : ''
          }
        />
      </div>

      {/* Institution / Department Code */}
      {(nodeType === 'institution' || nodeType === 'department') && (
        <div>
          <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
            Code <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            value={String(formData['code'] ?? '')}
            onChange={(e) => handleFieldChange('code', e.target.value.toUpperCase())}
            placeholder="e.g. CSE"
            className={fixHint?.field === 'code' ? 'border-[#FACC15] ring-1 ring-[#FACC15]' : ''}
          />
        </div>
      )}

      {/* Program duration */}
      {nodeType === 'program' && (
        <div>
          <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
            Duration (Years) <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            type="number"
            min={1}
            max={6}
            value={Number(formData['durationYears'] ?? 4)}
            onChange={(e) => handleFieldChange('durationYears', parseInt(e.target.value, 10))}
            className={fixHint?.field === 'durationYears' ? 'border-[#FACC15] ring-1 ring-[#FACC15]' : ''}
          />
        </div>
      )}

      {/* Academic Year */}
      {nodeType === 'academicYear' && (
        <div>
          <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
            Year Number <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            type="number"
            min={1}
            max={6}
            value={Number(formData['yearNumber'] ?? 1)}
            onChange={(e) => handleFieldChange('yearNumber', parseInt(e.target.value, 10))}
            className={fixHint?.field === 'yearNumber' ? 'border-[#FACC15] ring-1 ring-[#FACC15]' : ''}
          />
        </div>
      )}

      {/* Semester */}
      {nodeType === 'semester' && (
        <>
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
              Semester Number <span className="text-[#EF4444]">*</span>
            </label>
            <Input
              type="number"
              min={1}
              max={12}
              value={Number(formData['number'] ?? 1)}
              onChange={(e) => handleFieldChange('number', parseInt(e.target.value, 10))}
              className={fixHint?.field === 'number' ? 'border-[#FACC15] ring-1 ring-[#FACC15]' : ''}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Start Date</label>
              <Input
                type="date"
                value={String(formData['startDate'] ?? '')}
                onChange={(e) => handleFieldChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#FAFAFA] mb-1">End Date</label>
              <Input
                type="date"
                value={String(formData['endDate'] ?? '')}
                onChange={(e) => handleFieldChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </>
      )}

      {/* Section */}
      {nodeType === 'section' && (
        <div>
          <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
            Student Strength <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            type="number"
            min={1}
            value={Number(formData['strength'] ?? 60)}
            onChange={(e) => handleFieldChange('strength', parseInt(e.target.value, 10))}
            className={fixHint?.field === 'strength' ? 'border-[#FACC15] ring-1 ring-[#FACC15]' : ''}
          />
          <p className="text-[10px] font-mono text-[#8A8A8A] mt-1">
            Sum of child batch sizes cannot exceed this capacity.
          </p>
        </div>
      )}

      {/* Batch */}
      {nodeType === 'batch' && (
        <div>
          <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
            Batch Size <span className="text-[#EF4444]">*</span>
          </label>
          <Input
            type="number"
            min={1}
            value={Number(formData['size'] ?? 30)}
            onChange={(e) => handleFieldChange('size', parseInt(e.target.value, 10))}
            className={fixHint?.field === 'size' ? 'border-[#FACC15] ring-1 ring-[#FACC15]' : ''}
          />
        </div>
      )}

      {/* Subject Assignment */}
      {nodeType === 'subjectAssignment' && (
        <>
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
              Type <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={String(formData['type'] ?? 'theory')}
              onChange={(e) => handleFieldChange('type', e.target.value)}
              className="w-full h-8 bg-[#161616] border border-[#232323] rounded px-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#FACC15]"
            >
              <option value="theory">Theory</option>
              <option value="lab">Lab / Practical</option>
              <option value="tutorial">Tutorial</option>
              <option value="seminar">Seminar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
              Weekly Hours <span className="text-[#EF4444]">*</span>
            </label>
            <Input
              type="number"
              min={1}
              max={15}
              value={Number(formData['weeklyHours'] ?? 3)}
              onChange={(e) => handleFieldChange('weeklyHours', parseInt(e.target.value, 10))}
              className={fixHint?.field === 'weeklyHours' ? 'border-[#FACC15] ring-1 ring-[#FACC15]' : ''}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Faculty Linkage</label>
            <Input
              value={String(formData['facultyName'] ?? formData['facultyId'] ?? '')}
              onChange={(e) => handleFieldChange('facultyName', e.target.value)}
              placeholder="Assign faculty instructor"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Room Requirement</label>
            <Input
              value={String(formData['roomName'] ?? formData['roomId'] ?? '')}
              onChange={(e) => handleFieldChange('roomName', e.target.value)}
              placeholder="Assign classroom or lab"
            />
          </div>
        </>
      )}

      {/* Elective Group */}
      {nodeType === 'electiveGroup' && (
        <div>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
            <input
              type="checkbox"
              checked={Boolean(formData['mustBeSimultaneous'] ?? true)}
              onChange={(e) => handleFieldChange('mustBeSimultaneous', e.target.checked)}
              className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
            />
            <span className="text-xs text-[#FAFAFA]">Run Electives Simultaneously</span>
          </label>
          <p className="text-[10px] font-mono text-[#8A8A8A] mt-1">
            All chosen elective subjects in this group will be scheduled at the same timetable slot.
          </p>
        </div>
      )}

      {/* Faculty Resource */}
      {nodeType === 'faculty' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Max Hours / Day</label>
            <Input
              type="number"
              min={1}
              max={8}
              value={Number(formData['maxHoursPerDay'] ?? 4)}
              onChange={(e) => handleFieldChange('maxHoursPerDay', parseInt(e.target.value, 10))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">Max Hours / Week</label>
            <Input
              type="number"
              min={1}
              max={40}
              value={Number(formData['maxHoursPerWeek'] ?? 18)}
              onChange={(e) => handleFieldChange('maxHoursPerWeek', parseInt(e.target.value, 10))}
            />
          </div>
        </div>
      )}

      {/* Room Resource */}
      {nodeType === 'room' && (
        <>
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
              Room Type <span className="text-[#EF4444]">*</span>
            </label>
            <select
              value={String(formData['type'] ?? 'lecture')}
              onChange={(e) => handleFieldChange('type', e.target.value)}
              className="w-full h-8 bg-[#161616] border border-[#232323] rounded px-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-[#FACC15]"
            >
              <option value="lecture">Lecture Hall</option>
              <option value="lab">Computer / Science Lab</option>
              <option value="seminar">Seminar Room</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#FAFAFA] mb-1">
              Seating Capacity <span className="text-[#EF4444]">*</span>
            </label>
            <Input
              type="number"
              min={1}
              value={Number(formData['capacity'] ?? 60)}
              onChange={(e) => handleFieldChange('capacity', parseInt(e.target.value, 10))}
            />
          </div>
        </>
      )}

      {/* Save / Reset Actions */}
      <div className="pt-4 border-t border-[#232323] flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          disabled={!isDirty}
          className="text-xs text-[#8A8A8A]"
        >
          Reset
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={!isDirty}
          className="text-xs gap-1.5"
        >
          <Check className="h-3.5 w-3.5" />
          <span>Apply Changes</span>
        </Button>
      </div>
    </div>
  );
}

export function BlueprintSidebar({ projectId, onUpdateConfig }: BlueprintSidebarProps) {
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const nodes = useBlueprintStore((s) => s.nodes);
  const activeTab = useBlueprintStore((s) => s.activeTab);
  const setActiveTab = useBlueprintStore((s) => s.setActiveTab);
  const setActiveCommentsNodeId = useBlueprintStore((s) => s.setActiveCommentsNodeId);

  const [recommendations, setRecommendations] = useState<BlueprintRecommendationDto[]>([]);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Fetch recommendations for the selected node or project
  useEffect(() => {
    if (!selectedNodeId) return;

    let mounted = true;
    async function fetchRecommendations() {
      try {
        const recs = await blueprintApi.getRecommendations(projectId, selectedNodeId || undefined);
        if (mounted) {
          setRecommendations(recs || []);
        }
      } catch {
        if (mounted) {
          setRecommendations([]);
        }
      }
    }

    void fetchRecommendations();

    return () => {
      mounted = false;
    };
  }, [projectId, selectedNodeId]);

  if (!selectedNode) {
    return (
      <aside className="w-80 h-full border-l border-[#232323] bg-[#0A0A0A] p-4 flex flex-col items-center justify-center text-center text-[#8A8A8A]">
        <Sliders className="h-8 w-8 text-[#333333] mb-2" />
        <p className="text-xs font-semibold text-[#FAFAFA]">No Node Selected</p>
        <p className="text-[11px] font-mono mt-1">Select a node from the canvas to edit its properties.</p>
      </aside>
    );
  }

  return (
    <aside className="w-80 h-full border-l border-[#232323] bg-[#0A0A0A] flex flex-col z-20">
      {/* Sidebar Tabs */}
      <div className="h-10 border-b border-[#232323] px-2 flex items-center gap-1 bg-[#111111]">
        <Button
          variant={activeTab === 'config' ? 'primary' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1.5 flex-1"
          onClick={() => setActiveTab('config')}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>Config</span>
        </Button>
        <Button
          variant={activeTab === 'constraints' ? 'primary' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1.5 flex-1 text-[#8A8A8A]"
          onClick={() => setActiveTab('constraints')}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Constraints</span>
        </Button>
        <Button
          variant={activeTab === 'ai' ? 'primary' : 'ghost'}
          size="sm"
          className="h-7 text-xs gap-1.5 flex-1 text-[#8A8A8A]"
          onClick={() => setActiveTab('ai')}
        >
          <Sparkles className="h-3.5 w-3.5 text-[#FACC15]" />
          <span>Slotly AI</span>
        </Button>
      </div>

      {/* Sidebar Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'config' && (
          <div>
            {/* Selected Node Status Summary */}
            <div className="p-2.5 rounded bg-[#111111] border border-[#232323] mb-4">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-mono text-[10px] uppercase text-[#8A8A8A]">
                  {selectedNode.data.nodeType}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      selectedNode.data.effectiveStatus === 'complete'
                        ? 'green'
                        : selectedNode.data.effectiveStatus === 'blocked'
                        ? 'neutral'
                        : 'yellow'
                    }
                    className="font-mono text-[9px] uppercase"
                  >
                    {selectedNode.data.effectiveStatus}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveCommentsNodeId(selectedNode.id)}
                    title="View node comments"
                    className="h-5 w-5 text-[#8A8A8A] hover:text-[#FAFAFA]"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-xs text-[#FAFAFA] truncate">
                {selectedNode.data.label}
              </h3>
            </div>

            {/* Dynamic Node Config Form with Key for State Reset */}
            <NodeConfigForm
              key={selectedNode.id}
              node={selectedNode}
              onUpdateConfig={onUpdateConfig}
              recommendations={recommendations}
            />
          </div>
        )}

        {activeTab === 'constraints' && (
          <div className="py-8 text-center text-[#8A8A8A]">
            <ShieldCheck className="h-8 w-8 text-[#333333] mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-[#FAFAFA]">Constraint Engine</h4>
            <p className="text-[11px] font-mono mt-1 leading-relaxed">
              Constraint inheritance and conflict solver will be fully connected in Phase 8.
            </p>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="py-8 text-center text-[#8A8A8A]">
            <Sparkles className="h-8 w-8 text-[#FACC15] mx-auto mb-2" />
            <h4 className="text-xs font-semibold text-[#FAFAFA]">Slotly AI Assistant</h4>
            <p className="text-[11px] font-mono mt-1 leading-relaxed">
              LangGraph intelligent structural assistant will be activated in Phase 10.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
