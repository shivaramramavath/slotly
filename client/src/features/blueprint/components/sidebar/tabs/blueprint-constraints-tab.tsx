// React component for blueprint-constraints-tab.
'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  FolderTree,
  GraduationCap,
  Users2,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';
import { useBlueprintStore } from '../../../store/blueprint.store';
import { blueprintApi } from '@/features/projects/services/blueprint.api';
import { ConflictCard } from '../../validation/conflict-card';
import type { ConstraintScope, ValidationReportDto } from '@slotly/contracts';

interface BlueprintConstraintsTabProps {
  projectId: string;
}

/** React component rendering blueprint constraints tab. */
export function BlueprintConstraintsTab({ projectId }: BlueprintConstraintsTabProps) {
  const selectedNodeId = useBlueprintStore((s) => s.selectedNodeId);
  const nodes = useBlueprintStore((s) => s.nodes);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Determine active scope based on selected node, or default to institution
  const initialScope: ConstraintScope =
    selectedNode?.data.nodeType === 'section'
      ? 'section'
      : selectedNode?.data.nodeType === 'program'
      ? 'program'
      : selectedNode?.data.nodeType === 'department'
      ? 'department'
      : 'institution';

  const [activeScope, setActiveScope] = useState<ConstraintScope>(initialScope);
  const [activeTab, setActiveTab] = useState<'hard' | 'soft'>('hard');
  const [overrides, setOverrides] = useState<Set<string>>(new Set());
  const [isValidating, setIsValidating] = useState(false);
  const [validationReport, setValidationReport] = useState<ValidationReportDto | null>(null);

  // Constraint state toggles
  const [hardConfig, setHardConfig] = useState({
    facultyNoDoubleBooking: true,
    facultyAvailability: true,
    maxHoursPerDay: 4,
    maxHoursPerWeek: 18,
    roomNoDoubleBooking: true,
    roomCapacityFitsSection: true,
    roomTypeMatchesSubject: true,
    equipmentMatch: true,
    sectionNoDoubleBooking: true,
    sectionAvailability: true,
    maxClassesPerDay: 5,
    minBreaks: true,
    labConsecutiveBlock: true,
    electiveSimultaneity: true,
  });

  const [softConfig, setSoftConfig] = useState({
    facultyPreferredPeriods: 5,
    balanceFacultyLoad: 5,
    minimizeRoomChanges: 4,
    spreadSubjectsAcrossDays: 8,
    limitConsecutiveSameSubject: 6,
    labsInAfternoon: 7,
    departmentRules: 5,
  });

  const isOverridden = (key: string) => overrides.has(`${activeScope}:${key}`);

  const toggleOverride = (key: string) => {
    const scopeKey = `${activeScope}:${key}`;
    setOverrides((prev) => {
      const next = new Set(prev);
      if (next.has(scopeKey)) {
        next.delete(scopeKey);
        toast.info('Inheritance restored', `Constraint '${key}' will now inherit from higher scope.`);
      } else {
        next.add(scopeKey);
        toast.success('Override created', `Constraint '${key}' customized for ${activeScope} scope.`);
      }
      return next;
    });
  };

  const handleValidate = async () => {
    setIsValidating(true);
    try {
      const report = await blueprintApi.validateProject(projectId);
      setValidationReport(report);
      if (report.valid) {
        toast.success('Validation Passed', 'All hard constraints satisfied and 0 pre-build errors found.');
      } else {
        toast.error('Validation Conflicts', `Found ${report.hardViolationsCount} hard conflict(s) and ${report.preBuildErrors.length} pre-build issue(s).`);
      }
    } catch (err) {
      toast.error('Validation failed', (err as Error).message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Scope Selector */}
      <div className="p-2 rounded bg-[#111111] border border-[#232323] space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-[#8A8A8A] font-medium">Constraint Scope</span>
          <Badge variant="yellow" className="text-[9px] uppercase font-mono">
            {activeScope} scope
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-1">
          <Button
            variant={activeScope === 'institution' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveScope('institution')}
            className="h-6 px-1 text-[10px] gap-1"
          >
            <Building2 className="h-3 w-3" />
            <span>Inst</span>
          </Button>
          <Button
            variant={activeScope === 'department' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveScope('department')}
            className="h-6 px-1 text-[10px] gap-1"
          >
            <FolderTree className="h-3 w-3" />
            <span>Dept</span>
          </Button>
          <Button
            variant={activeScope === 'program' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveScope('program')}
            className="h-6 px-1 text-[10px] gap-1"
          >
            <GraduationCap className="h-3 w-3" />
            <span>Prog</span>
          </Button>
          <Button
            variant={activeScope === 'section' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveScope('section')}
            className="h-6 px-1 text-[10px] gap-1"
          >
            <Users2 className="h-3 w-3" />
            <span>Sec</span>
          </Button>
        </div>
      </div>

      {/* Hard vs Soft Toggle */}
      <div className="flex rounded-md border border-[#232323] p-0.5 bg-[#111111]">
        <button
          type="button"
          onClick={() => setActiveTab('hard')}
          className={`flex-1 py-1 text-center font-medium rounded transition-colors ${
            activeTab === 'hard' ? 'bg-[#181818] text-[#FAFAFA]' : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
          }`}
        >
          Hard Constraints
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('soft')}
          className={`flex-1 py-1 text-center font-medium rounded transition-colors ${
            activeTab === 'soft' ? 'bg-[#181818] text-[#FAFAFA]' : 'text-[#8A8A8A] hover:text-[#FAFAFA]'
          }`}
        >
          Soft Preferences
        </button>
      </div>

      {/* Validate Project Action Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleValidate}
        disabled={isValidating}
        className="w-full text-xs gap-1.5 border-[#232323] hover:border-[#FACC15]"
      >
        <ShieldCheck className="h-3.5 w-3.5 text-[#FACC15]" />
        <span>{isValidating ? 'Validating Constraints...' : 'Validate Current Blueprint'}</span>
      </Button>

      {/* Active Validation Report Summary if run */}
      {validationReport && (
        <div className="space-y-2 pt-2 border-t border-[#232323]">
          <div className="p-2.5 rounded bg-[#161616] border border-[#232323] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {validationReport.valid ? (
                <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-[#EF4444]" />
              )}
              <span className="font-semibold text-[#FAFAFA]">
                {validationReport.valid ? 'All Constraints Valid' : 'Conflicts Detected'}
              </span>
            </div>
            <Badge
              variant={validationReport.valid ? 'green' : 'red'}
              className="font-mono text-[9px]"
            >
              Score: {validationReport.score}/100
            </Badge>
          </div>

          {/* Violations List */}
          {validationReport.violations.map((viol) => (
            <ConflictCard key={viol.id} violation={viol} />
          ))}

          {/* Pre-build check errors */}
          {validationReport.preBuildErrors.map((err, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded bg-[#161616] border border-[#EF4444]/40 text-xs space-y-1"
            >
              <div className="flex items-center justify-between text-[#EF4444] font-semibold">
                <span>{err.code}</span>
                <Badge variant="red" className="text-[9px]">Pre-build</Badge>
              </div>
              <p className="text-[#FAFAFA] text-[11px]">{err.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* HARD CONSTRAINTS LIST */}
      {activeTab === 'hard' && (
        <div className="space-y-4">
          {/* Group 1: Faculty */}
          <div className="p-3 rounded-lg border border-[#232323] bg-[#111111] space-y-2.5">
            <h4 className="font-semibold text-[#FAFAFA] text-xs">Faculty Rules</h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hardConfig.facultyNoDoubleBooking}
                    onChange={(e) => setHardConfig({ ...hardConfig, facultyNoDoubleBooking: e.target.checked })}
                    className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
                  />
                  <span>No Double Booking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={isOverridden('facultyNoDoubleBooking') ? 'yellow' : 'neutral'} className="text-[8px] font-mono">
                    {isOverridden('facultyNoDoubleBooking') ? 'Override' : 'Inherited'}
                  </Badge>
                  <button type="button" onClick={() => toggleOverride('facultyNoDoubleBooking')} className="text-[#8A8A8A] hover:text-[#FAFAFA]">
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hardConfig.facultyAvailability}
                    onChange={(e) => setHardConfig({ ...hardConfig, facultyAvailability: e.target.checked })}
                    className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
                  />
                  <span>Respect Availability Matrix</span>
                </div>
                <Badge variant="neutral" className="text-[8px] font-mono">Inherited</Badge>
              </label>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#8A8A8A]">Max Hours / Day</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={hardConfig.maxHoursPerDay}
                  onChange={(e) => setHardConfig({ ...hardConfig, maxHoursPerDay: parseInt(e.target.value, 10) || 4 })}
                  className="w-16 h-6 px-1.5 bg-[#161616] border border-[#232323] rounded text-right font-mono text-xs text-[#FAFAFA]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#8A8A8A]">Max Hours / Week</span>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={hardConfig.maxHoursPerWeek}
                  onChange={(e) => setHardConfig({ ...hardConfig, maxHoursPerWeek: parseInt(e.target.value, 10) || 18 })}
                  className="w-16 h-6 px-1.5 bg-[#161616] border border-[#232323] rounded text-right font-mono text-xs text-[#FAFAFA]"
                />
              </div>
            </div>
          </div>

          {/* Group 2: Room */}
          <div className="p-3 rounded-lg border border-[#232323] bg-[#111111] space-y-2.5">
            <h4 className="font-semibold text-[#FAFAFA] text-xs">Room Rules</h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hardConfig.roomNoDoubleBooking}
                    onChange={(e) => setHardConfig({ ...hardConfig, roomNoDoubleBooking: e.target.checked })}
                    className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
                  />
                  <span>No Room Double Booking</span>
                </div>
                <Badge variant="neutral" className="text-[8px] font-mono">Inherited</Badge>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hardConfig.roomCapacityFitsSection}
                    onChange={(e) => setHardConfig({ ...hardConfig, roomCapacityFitsSection: e.target.checked })}
                    className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
                  />
                  <span>Room Capacity Fits Section</span>
                </div>
                <Badge variant="neutral" className="text-[8px] font-mono">Inherited</Badge>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hardConfig.roomTypeMatchesSubject}
                    onChange={(e) => setHardConfig({ ...hardConfig, roomTypeMatchesSubject: e.target.checked })}
                    className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
                  />
                  <span>Room Type Matches Subject</span>
                </div>
                <Badge variant="neutral" className="text-[8px] font-mono">Inherited</Badge>
              </label>
            </div>
          </div>

          {/* Group 3: Section */}
          <div className="p-3 rounded-lg border border-[#232323] bg-[#111111] space-y-2.5">
            <h4 className="font-semibold text-[#FAFAFA] text-xs">Section Rules</h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hardConfig.sectionNoDoubleBooking}
                    onChange={(e) => setHardConfig({ ...hardConfig, sectionNoDoubleBooking: e.target.checked })}
                    className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
                  />
                  <span>No Simultaneous Class Conflicts</span>
                </div>
                <Badge variant="neutral" className="text-[8px] font-mono">Inherited</Badge>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hardConfig.minBreaks}
                    onChange={(e) => setHardConfig({ ...hardConfig, minBreaks: e.target.checked })}
                    className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
                  />
                  <span>Respect Mandatory Breaks</span>
                </div>
                <Badge variant="neutral" className="text-[8px] font-mono">Inherited</Badge>
              </label>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[#8A8A8A]">Max Classes / Day</span>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={hardConfig.maxClassesPerDay}
                  onChange={(e) => setHardConfig({ ...hardConfig, maxClassesPerDay: parseInt(e.target.value, 10) || 5 })}
                  className="w-16 h-6 px-1.5 bg-[#161616] border border-[#232323] rounded text-right font-mono text-xs text-[#FAFAFA]"
                />
              </div>
            </div>
          </div>

          {/* Group 4: Laboratory */}
          <div className="p-3 rounded-lg border border-[#232323] bg-[#111111] space-y-2.5">
            <h4 className="font-semibold text-[#FAFAFA] text-xs">Laboratory Rules</h4>

            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hardConfig.labConsecutiveBlock}
                    onChange={(e) => setHardConfig({ ...hardConfig, labConsecutiveBlock: e.target.checked })}
                    className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
                  />
                  <span>Contiguous Consecutive Periods Block</span>
                </div>
                <Badge variant="neutral" className="text-[8px] font-mono">Inherited</Badge>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hardConfig.electiveSimultaneity}
                    onChange={(e) => setHardConfig({ ...hardConfig, electiveSimultaneity: e.target.checked })}
                    className="rounded border-[#232323] bg-[#161616] text-[#FACC15]"
                  />
                  <span>Elective Group Simultaneity</span>
                </div>
                <Badge variant="neutral" className="text-[8px] font-mono">Inherited</Badge>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SOFT PREFERENCES LIST */}
      {activeTab === 'soft' && (
        <div className="space-y-3">
          <div className="p-3 rounded-lg border border-[#232323] bg-[#111111] space-y-3">
            <h4 className="font-semibold text-[#FAFAFA] text-xs">Optimization Weights (1 - 10)</h4>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Faculty Preferred Periods</span>
                  <span className="font-mono text-[#FACC15]">{softConfig.facultyPreferredPeriods}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={softConfig.facultyPreferredPeriods}
                  onChange={(e) => setSoftConfig({ ...softConfig, facultyPreferredPeriods: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-[#232323] rounded appearance-none cursor-pointer accent-[#FACC15]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Spread Subjects Across Days</span>
                  <span className="font-mono text-[#FACC15]">{softConfig.spreadSubjectsAcrossDays}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={softConfig.spreadSubjectsAcrossDays}
                  onChange={(e) => setSoftConfig({ ...softConfig, spreadSubjectsAcrossDays: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-[#232323] rounded appearance-none cursor-pointer accent-[#FACC15]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Limit Consecutive Same Subject</span>
                  <span className="font-mono text-[#FACC15]">{softConfig.limitConsecutiveSameSubject}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={softConfig.limitConsecutiveSameSubject}
                  onChange={(e) => setSoftConfig({ ...softConfig, limitConsecutiveSameSubject: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-[#232323] rounded appearance-none cursor-pointer accent-[#FACC15]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Balance Faculty Load</span>
                  <span className="font-mono text-[#FACC15]">{softConfig.balanceFacultyLoad}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={softConfig.balanceFacultyLoad}
                  onChange={(e) => setSoftConfig({ ...softConfig, balanceFacultyLoad: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-[#232323] rounded appearance-none cursor-pointer accent-[#FACC15]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Labs In Afternoon</span>
                  <span className="font-mono text-[#FACC15]">{softConfig.labsInAfternoon}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={softConfig.labsInAfternoon}
                  onChange={(e) => setSoftConfig({ ...softConfig, labsInAfternoon: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-[#232323] rounded appearance-none cursor-pointer accent-[#FACC15]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Minimize Room Changes</span>
                  <span className="font-mono text-[#FACC15]">{softConfig.minimizeRoomChanges}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={softConfig.minimizeRoomChanges}
                  onChange={(e) => setSoftConfig({ ...softConfig, minimizeRoomChanges: parseInt(e.target.value, 10) })}
                  className="w-full h-1.5 bg-[#232323] rounded appearance-none cursor-pointer accent-[#FACC15]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
