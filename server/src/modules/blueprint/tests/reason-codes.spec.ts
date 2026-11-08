// Unit tests verifying canonical reason codes, alias mapping, and human-readable explanations.
import {
  ReasonCodeSchema,
  normalizeReasonCode,
  REASON_CODE_MESSAGES,
  type ReasonCode,
} from '@slotly/contracts';

describe('Reason Codes Canonicalization (AUD-005)', () => {
  it('should define all canonical reason codes in ReasonCodeSchema', () => {
    const requiredCodes: ReasonCode[] = [
      'PARENT_MISSING',
      'PARENT_INCOMPLETE',
      'PARENT_TYPE_NOT_ALLOWED',
      'DUPLICATE_NAME',
      'CAPACITY_EXCEEDED',
      'CYCLE',
      'ENDPOINT_INCOMPLETE',
      'NOT_QUALIFIED',
      'PROJECT_LOCKED',
      'PERMISSION_DENIED',
      'SINGLE_PARENT_VIOLATION',
      'INVALID_OPERATION',
      'REVISION_CONFLICT',
      'INSUFFICIENT_LAB_CAPACITY',
      'MISSING_ALLOCATION',
      'FACULTY_OVERLOAD',
      'INVALID_GRAPH',
    ];

    for (const code of requiredCodes) {
      expect(ReasonCodeSchema.options).toContain(code);
    }
  });

  it('should normalize aliases, lowercase, and hyphenated variations to canonical codes', () => {
    expect(normalizeReasonCode('PARENT_MISSING')).toBe('PARENT_MISSING');
    expect(normalizeReasonCode('parent_missing')).toBe('PARENT_MISSING');
    expect(normalizeReasonCode('parent-missing')).toBe('PARENT_MISSING');
    expect(normalizeReasonCode('PARENT_NOT_FOUND')).toBe('PARENT_MISSING');

    expect(normalizeReasonCode('unauthorized')).toBe('PERMISSION_DENIED');
    expect(normalizeReasonCode('FORBIDDEN')).toBe('PERMISSION_DENIED');
    expect(normalizeReasonCode('PERMISSION_DENIED')).toBe('PERMISSION_DENIED');

    expect(normalizeReasonCode('DUPLICATE_CODE')).toBe('DUPLICATE_NAME');
    expect(normalizeReasonCode('CIRCULAR_DEPENDENCY')).toBe('CYCLE');
    expect(normalizeReasonCode('STALE_REVISION')).toBe('REVISION_CONFLICT');
  });

  it('should provide human-friendly explanation for every canonical reason code', () => {
    for (const code of ReasonCodeSchema.options) {
      const message = REASON_CODE_MESSAGES[code];
      expect(typeof message).toBe('string');
      expect(message.length).toBeGreaterThan(10);
    }
  });
});
