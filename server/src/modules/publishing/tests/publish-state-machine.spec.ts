// Unit tests verifying PublishStateMachine state pattern lifecycle transitions and guards.
import { PublishStateMachine } from '../state-machine/publish-state-machine';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('PublishStateMachine', () => {
  it('should initialize with draft by default and allow transition to editing', () => {
    const sm = new PublishStateMachine();
    expect(sm.getStatus()).toBe('draft');
    expect(sm.canTransitionTo('editing')).toBe(true);

    sm.transition('editing');
    expect(sm.getStatus()).toBe('editing');
  });

  it('should prevent transition to validated if blueprint is incomplete', () => {
    const sm = new PublishStateMachine('editing');
    expect(
      sm.canTransitionTo('validated', {
        isBlueprintComplete: false,
        conflicts: [],
      }),
    ).toBe(false);

    expect(() =>
      sm.transition('validated', {
        isBlueprintComplete: false,
        conflicts: [],
      }),
    ).toThrow(BadRequestException);
  });

  it('should prevent transition to validated if hard conflicts exist', () => {
    const sm = new PublishStateMachine('editing');
    expect(
      sm.canTransitionTo('validated', {
        isBlueprintComplete: true,
        conflicts: [{ severity: 'hard' }],
      }),
    ).toBe(false);

    expect(() =>
      sm.transition('validated', {
        isBlueprintComplete: true,
        conflicts: [{ severity: 'hard' }],
      }),
    ).toThrow(BadRequestException);
  });

  it('should allow transition to validated if blueprint is complete and hard conflicts are zero (soft conflicts permitted)', () => {
    const sm = new PublishStateMachine('editing');
    expect(
      sm.canTransitionTo('validated', {
        isBlueprintComplete: true,
        conflicts: [{ severity: 'soft' }],
      }),
    ).toBe(true);

    sm.transition('validated', {
      isBlueprintComplete: true,
      conflicts: [{ severity: 'soft' }],
    });
    expect(sm.getStatus()).toBe('validated');
  });

  it('should transition from validated to pending_approval', () => {
    const sm = new PublishStateMachine('validated');
    expect(sm.canTransitionTo('pending_approval')).toBe(true);
    sm.transition('pending_approval');
    expect(sm.getStatus()).toBe('pending_approval');
  });

  it('should require a comment when admin rejects pending_approval back to editing', () => {
    const sm = new PublishStateMachine('pending_approval');

    // Without comment, rejection is blocked
    expect(sm.canTransitionTo('editing')).toBe(false);
    expect(() => sm.transition('editing')).toThrow(BadRequestException);

    // With comment, rejection succeeds and returns to editing
    expect(
      sm.canTransitionTo('editing', {
        comment: 'Room 201 has scheduled renovation on Wednesday',
      }),
    ).toBe(true);

    sm.transition('editing', {
      comment: 'Room 201 has scheduled renovation on Wednesday',
    });
    expect(sm.getStatus()).toBe('editing');
  });

  it('should transition pending_approval -> approved -> published', () => {
    const sm = new PublishStateMachine('pending_approval');
    sm.transition('approved');
    expect(sm.getStatus()).toBe('approved');

    sm.transition('published');
    expect(sm.getStatus()).toBe('published');
  });

  it('should enforce immutability on published versions: cannot transition to draft, editing, or approved', () => {
    const sm = new PublishStateMachine('published');

    expect(sm.canTransitionTo('editing')).toBe(false);
    expect(() => sm.transition('editing')).toThrow(ConflictException);

    expect(sm.canTransitionTo('draft')).toBe(false);
    expect(() => sm.transition('draft')).toThrow(ConflictException);

    // Only archiving is permitted for published versions
    expect(sm.canTransitionTo('archived')).toBe(true);
    sm.transition('archived');
    expect(sm.getStatus()).toBe('archived');
  });

  it('should treat archived as terminal state', () => {
    const sm = new PublishStateMachine('archived');
    expect(sm.canTransitionTo('editing')).toBe(false);
    expect(sm.canTransitionTo('draft')).toBe(false);
    expect(sm.canTransitionTo('published')).toBe(false);
    expect(() => sm.transition('draft')).toThrow(ConflictException);
  });
});
