// Assignments block for Section and Batch nodes managing Subject -> Faculty -> Room mappings.
'use client';

import * as React from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { blueprintApi } from '../../services/blueprint.api';
import { toast } from '@/components/ui/toast';
import type { BlueprintCanvasNode } from '../../types/canvas.types';
import type { AssignmentSuggestion } from '@slotly/contracts';
import { cn } from '@/lib/utils';

/** Interface defining local section/batch assignment row. */
export interface AssignmentRowItem {
  id: string;
  subjectId: string;
  subjectName?: string | undefined;
  weeklyHours?: number | undefined;
  facultyId?: string | undefined;
  facultyName?: string | undefined;
  roomId?: string | undefined;
  roomName?: string | undefined;
  status?: 'ok' | 'missing_faculty' | 'conflict' | 'auto_filled' | undefined;
  reason?: string | undefined;
}

/** Props for AssignmentsBlock component. */
export interface AssignmentsBlockProps {
  node: BlueprintCanvasNode;
  projectId: string;
  onUpdateAssignments: (assignments: AssignmentRowItem[]) => void;
  className?: string | undefined;
}

/** React component rendering subject assignments with Auto-assign all recommendations. */
export function AssignmentsBlock({
  node,
  projectId,
  onUpdateAssignments,
  className = '',
}: AssignmentsBlockProps) {
  const config = (node.data.config || {}) as Record<string, unknown>;
  const rawAssignments = (config['assignments'] as AssignmentRowItem[]) || [];

  const [assignments, setAssignments] = React.useState<AssignmentRowItem[]>(
    Array.isArray(rawAssignments) ? rawAssignments : [],
  );
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  // Extract candidate subjects, faculty, rooms from config pool
  const subjectIds =
    (config['subjectIds'] as string[]) ||
    (config['subjects'] as string[]) ||
    [];
  const facultyIds =
    (config['facultyIds'] as string[]) ||
    (config['faculty'] as string[]) ||
    [];
  const roomIds =
    (config['roomIds'] as string[]) ||
    (config['rooms'] as string[]) ||
    [];
  const defaultHomeRoom = (config['homeRoomId'] as string) || undefined;

  // Handle Add Empty Assignment
  const handleAddAssignment = () => {
    // Find first subject not yet assigned
    const assignedSubjectIds = assignments.map((a) => a.subjectId);
    const availableSubject = subjectIds.find((id) => !assignedSubjectIds.includes(id)) || subjectIds[0] || 'SUB_1';

    const newAssignment: AssignmentRowItem = {
      id: `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      subjectId: availableSubject,
      subjectName: availableSubject,
      weeklyHours: 4,
      facultyId: facultyIds[0] || undefined,
      roomId: defaultHomeRoom || roomIds[0] || undefined,
      status: facultyIds[0] ? 'ok' : 'missing_faculty',
    };

    const next = [...assignments, newAssignment];
    setAssignments(next);
    onUpdateAssignments(next);
    toast.success('Assignment added', `Subject ${newAssignment.subjectId} added.`);
  };

  // Handle Field Edit
  const handleUpdateRow = (id: string, patch: Partial<AssignmentRowItem>) => {
    const next = assignments.map((row) => (row.id === id ? { ...row, ...patch } : row));
    setAssignments(next);
    onUpdateAssignments(next);
  };

  // Handle Delete
  const handleDeleteRow = (id: string) => {
    const next = assignments.filter((row) => row.id !== id);
    setAssignments(next);
    onUpdateAssignments(next);
    toast.info('Assignment removed', 'Subject assignment deleted.');
  };

  // Handle "Auto-assign all" via POST /assignments/suggest
  const handleAutoAssignAll = async () => {
    setIsSuggesting(true);
    try {
      const res = await blueprintApi.suggestAssignments(projectId, node.id, { mode: 'all' });
      const suggestions: AssignmentSuggestion[] = res.suggestions || [];

      if (suggestions.length === 0) {
        toast.info('No suggestions', 'No unassigned subjects or available pool resources found.');
        return;
      }

      // Merge suggestions into assignments
      const next = [...assignments];
      let appliedCount = 0;

      suggestions.forEach((sug) => {
        const topFaculty = sug.faculty[0];
        const topRoom = sug.rooms[0];
        const existingIdx = next.findIndex((a) => a.subjectId === sug.subjectId);

        if (existingIdx >= 0) {
          const current = next[existingIdx];
          if (current) {
            next[existingIdx] = {
              ...current,
              facultyId: topFaculty?.id || current.facultyId,
              facultyName: topFaculty?.name || current.facultyName,
              roomId: topRoom?.id || current.roomId,
              roomName: topRoom?.name || current.roomName,
              status: topFaculty ? 'ok' : 'missing_faculty',
              reason: topFaculty?.reasons?.[0],
            };
            appliedCount++;
          }
        } else {
          next.push({
            id: `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            subjectId: sug.subjectId,
            subjectName: sug.subjectId,
            weeklyHours: 4,
            facultyId: topFaculty?.id,
            facultyName: topFaculty?.name,
            roomId: topRoom?.id || defaultHomeRoom,
            roomName: topRoom?.name,
            status: topFaculty ? 'ok' : 'missing_faculty',
            reason: topFaculty?.reasons?.[0],
          });
          appliedCount++;
        }
      });

      setAssignments(next);
      onUpdateAssignments(next);
      toast.success('Auto-assign completed', `Applied suggestions for ${appliedCount} subject(s).`);
    } catch (err) {
      toast.error('Suggestion failed', (err as Error).message || 'Unable to fetch assignment suggestions.');
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className={cn('space-y-2 select-none', className)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs text-[#FAFAFA]">Subject Assignments</span>
          <span className="font-mono text-[11px] text-[#8A8A8A]">
            {assignments.length} assigned
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoAssignAll}
            disabled={isSuggesting}
            className="h-6 px-2 text-[10px] font-mono gap-1 text-[#FAFAFA] border-[#2A2A2A] hover:border-[#FAFAFA]"
            title="Auto-assign all subjects using solver recommendations"
          >
            {isSuggesting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3 text-[#FACC15]" />
            )}
            <span>Auto-assign all</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAssignment}
            className="h-6 px-2 text-[10px] font-mono gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Assign</span>
          </Button>
        </div>
      </div>

      {/* Rows */}
      {assignments.length === 0 ? (
        <div className="py-4 px-3 rounded-[8px] border border-dashed border-[#232323] bg-[#0E0E0E] text-center space-y-1.5">
          <p className="text-[11px] text-[#8A8A8A]">
            No subjects assigned. Add subjects from your effective pool or click Auto-assign.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAssignment}
            className="h-6 text-[10px] font-mono gap-1"
          >
            <Plus className="h-3 w-3" />
            <span>Assign Subject</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {assignments.map((row) => (
            <div
              key={row.id}
              className="p-2 rounded-[8px] bg-[#111111] border border-[#232323] hover:border-[#383838] transition-colors space-y-1.5 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-medium text-[#FAFAFA] truncate">
                    {row.subjectName || row.subjectId}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-[10px] text-[#8A8A8A]">
                    <Clock className="h-3 w-3" />
                    <span>{row.weeklyHours || 4} hrs/wk</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Status Indicator */}
                  {row.status === 'ok' && (
                    <span title={row.reason || 'Qualified faculty assigned'}>
                      <CheckCircle className="h-3.5 w-3.5 text-[#22C55E]" />
                    </span>
                  )}
                  {row.status === 'missing_faculty' && (
                    <span
                      className="px-1.5 py-0.5 rounded bg-[#2A1E10] text-[#FACC15] text-[10px] font-mono border border-[#4A3515] inline-flex items-center gap-1"
                      title={row.reason || 'Missing faculty assignment'}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>No faculty</span>
                    </span>
                  )}
                  {row.status === 'conflict' && (
                    <span
                      className="px-1.5 py-0.5 rounded bg-[#2A1414] text-[#EF4444] text-[10px] font-mono border border-[#4A2020] inline-flex items-center gap-1"
                      title={row.reason || 'Conflict detected in assignment'}
                    >
                      <AlertTriangle className="h-3 w-3" />
                      <span>Conflict</span>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteRow(row.id)}
                    className="h-6 w-6 rounded text-[#8A8A8A] hover:text-[#EF4444] flex items-center justify-center transition-colors"
                    title="Remove assignment"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {/* Faculty & Room Pickers Row */}
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                {/* Faculty Select */}
                <div>
                  <label className="text-[10px] text-[#8A8A8A] block mb-0.5">Faculty</label>
                  <select
                    value={row.facultyId || ''}
                    onChange={(e) =>
                      handleUpdateRow(row.id, {
                        facultyId: e.target.value || undefined,
                        status: e.target.value ? 'ok' : 'missing_faculty',
                      })
                    }
                    className="w-full h-7 px-2 rounded bg-[#161616] border border-[#2B2B2B] text-xs text-[#FAFAFA] focus-visible:outline-none focus:border-[#FAFAFA]"
                  >
                    <option value="">Unassigned</option>
                    {facultyIds.map((fId) => (
                      <option key={fId} value={fId}>
                        {fId}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Room Select */}
                <div>
                  <label className="text-[10px] text-[#8A8A8A] block mb-0.5">Room</label>
                  <select
                    value={row.roomId || ''}
                    onChange={(e) =>
                      handleUpdateRow(row.id, {
                        roomId: e.target.value || undefined,
                      })
                    }
                    className="w-full h-7 px-2 rounded bg-[#161616] border border-[#2B2B2B] text-xs text-[#FAFAFA] focus-visible:outline-none focus:border-[#FAFAFA]"
                  >
                    <option value="">Default (Home room)</option>
                    {roomIds.map((rId) => (
                      <option key={rId} value={rId}>
                        {rId}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
