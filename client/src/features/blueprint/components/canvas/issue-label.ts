// Helper utility for formatting blueprint node issues and labels.

import type { BlueprintCanvasNode } from '../../types/canvas.types';

/** Interface defining a structured node issue item. */
export interface NodeIssueItem {
  id: string;
  severity: 'error' | 'warning';
  message: string;
  rawKey: string;
}

const KNOWN_FIELD_LABELS: Record<string, string> = {
  workingDays: 'Working days are not set',
  periodConfig: 'Period timing is not configured',
  durationYears: 'Degree duration is not set',
  yearNumber: 'Academic year number is not set',
  startDate: 'Term start date is missing',
  endDate: 'Term end date is missing',
  strength: 'Student strength is not configured',
  size: 'Batch size is not configured',
  weeklyHours: 'Weekly teaching hours are not set',
  maxHoursPerWeek: 'Maximum weekly workload is not configured',
  maxHoursPerDay: 'Maximum daily hours are not configured',
  capacity: 'Room capacity is not specified',
  code: 'Department or course code is missing',
  type: 'Type specification is not configured',
  name: 'Node name is not specified',
  label: 'Label is not specified',
  facultyId: 'Faculty is not assigned',
  subjectId: 'Subject is not assigned',
  subjectIds: 'At least two subjects are required',
  roomType: 'Room type is not specified',
  availability: 'Weekly availability is not configured',
  semesterNumber: 'Semester number is missing',
};

/**
 * Humanizes an unknown camelCase or snake_case key into readable text.
 */
function humanizeKey(rawKey: string): string {
  const spaced = rawKey
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase();

  return `${spaced.charAt(0).toUpperCase() + spaced.slice(1)} is required`;
}

/**
 * Formats a raw field key into a readable, plain-language sentence.
 */
export function formatIssueLabel(field: string): string {
  if (KNOWN_FIELD_LABELS[field]) {
    return KNOWN_FIELD_LABELS[field];
  }
  return humanizeKey(field);
}

/**
 * Groups and sorts issues for a node: blocking errors first, then warnings/missing fields.
 */
export function groupAndSortIssues(node: BlueprintCanvasNode): {
  errors: NodeIssueItem[];
  warnings: NodeIssueItem[];
  all: NodeIssueItem[];
  totalCount: number;
} {
  const errors: NodeIssueItem[] = [];
  const warnings: NodeIssueItem[] = [];

  const effectiveStatus = node.data.effectiveStatus || node.data.status;

  // 1. Check for blocking edge/parent status
  if (effectiveStatus === 'blocked') {
    errors.push({
      id: `${node.id}-parent-incomplete`,
      severity: 'error',
      message: 'Parent node is incomplete or blocked',
      rawKey: 'parent_dependency',
    });
  }

  // 2. Check for missing configuration fields
  const missing = node.data.missing || [];
  missing.forEach((item, index) => {
    const rawKey = item.field || `issue_${index}`;
    const readableMessage = formatIssueLabel(rawKey);

    // Critical identifying fields (code, dates, strength) count as errors, others as warnings
    const isError = ['code', 'workingDays', 'periodConfig', 'startDate', 'endDate'].includes(rawKey);

    const issueItem: NodeIssueItem = {
      id: `${node.id}-${rawKey}-${index}`,
      severity: isError ? 'error' : 'warning',
      message: item.message || readableMessage,
      rawKey,
    };

    if (isError) {
      errors.push(issueItem);
    } else {
      warnings.push(issueItem);
    }
  });

  const all = [...errors, ...warnings];

  return {
    errors,
    warnings,
    all,
    totalCount: all.length,
  };
}
