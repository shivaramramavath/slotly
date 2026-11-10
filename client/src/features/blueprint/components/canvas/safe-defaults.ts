// Helper utility providing safe default configurations for blueprint auto-fix.

import type { BlueprintNodeType } from '@slotly/contracts';

/**
 * Returns safe default configuration values for a node type to resolve missing requirements.
 */
export function getSafeDefaultsForNodeType(
  nodeType: BlueprintNodeType,
  currentConfig?: Record<string, unknown>,
): Record<string, unknown> {
  const cfg = currentConfig || {};

  switch (nodeType) {
    case 'institution':
      return {
        ...cfg,
        code: cfg.code || 'INST',
        workingDays: cfg.workingDays || [1, 2, 3, 4, 5],
        periodConfig: cfg.periodConfig || {
          startTime: '09:00',
          periodsPerDay: 7,
          periodDuration: 50,
        },
      };

    case 'department':
      return {
        ...cfg,
        code: cfg.code || 'DEPT',
      };

    case 'program':
      return {
        ...cfg,
        durationYears: typeof cfg.durationYears === 'number' && cfg.durationYears > 0 ? cfg.durationYears : 4,
      };

    case 'academicYear':
      return {
        ...cfg,
        yearNumber: typeof cfg.yearNumber === 'number' && cfg.yearNumber > 0 ? cfg.yearNumber : 1,
        label: cfg.label || 'Year 1',
      };

    case 'semester':
      return {
        ...cfg,
        semesterNumber: typeof cfg.semesterNumber === 'number' && cfg.semesterNumber > 0 ? cfg.semesterNumber : 1,
        startDate: cfg.startDate || '2026-08-01',
        endDate: cfg.endDate || '2026-12-15',
      };

    case 'section':
      return {
        ...cfg,
        strength: typeof cfg.strength === 'number' && cfg.strength > 0 ? cfg.strength : 60,
      };

    case 'batch':
      return {
        ...cfg,
        size: typeof cfg.size === 'number' && cfg.size > 0 ? cfg.size : 30,
      };

    case 'subjectAssignment':
      return {
        ...cfg,
        weeklyHours: typeof cfg.weeklyHours === 'number' && cfg.weeklyHours > 0 ? cfg.weeklyHours : 4,
        type: cfg.type || 'theory',
        roomType: cfg.roomType || 'lecture',
      };

    case 'faculty':
      return {
        ...cfg,
        maxHoursPerDay: typeof cfg.maxHoursPerDay === 'number' && cfg.maxHoursPerDay > 0 ? cfg.maxHoursPerDay : 4,
        maxHoursPerWeek: typeof cfg.maxHoursPerWeek === 'number' && cfg.maxHoursPerWeek > 0 ? cfg.maxHoursPerWeek : 16,
        availability: cfg.availability || [
          [true, true, true, true, true, true, true],
          [true, true, true, true, true, true, true],
          [true, true, true, true, true, true, true],
          [true, true, true, true, true, true, true],
          [true, true, true, true, true, true, true],
        ],
      };

    case 'room':
      return {
        ...cfg,
        capacity: typeof cfg.capacity === 'number' && cfg.capacity > 0 ? cfg.capacity : 60,
        type: cfg.type || 'lecture',
      };

    default:
      return { ...cfg };
  }
}
