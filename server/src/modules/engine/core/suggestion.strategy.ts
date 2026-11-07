import type { Violation, ViolationSuggestion } from './types';
import type { ScheduleState } from './schedule-state';
import type { ConstraintRegistry } from './constraint.registry';

export class SuggestionStrategy {
  constructor(private readonly registry: ConstraintRegistry) {}

  /**
   * Generates ranked conflict-free alternative period and room suggestions for a violation.
   */
  generateSuggestions(
    state: ScheduleState,
    violation: Violation,
    maxSuggestions = 3,
  ): ViolationSuggestion[] {
    const suggestions: ViolationSuggestion[] = [];
    const hardConstraints = this.registry.getHardConstraints();

    // Find the primary problematic slot
    const slotId = violation.slotRefs[0];
    const slot = state.slots.find((s) => s.id === slotId);
    if (!slot) return suggestions;

    const daysCount = state.input.settings.days.length;
    const periodsCount = state.input.settings.periodsPerDay;
    const breaks = state.input.settings.breaks || [];

    // Helper: test hypothetical move against all hard constraints
    const isMoveHardViolationFree = (
      targetDay: number,
      targetPeriod: number,
      targetRoomId?: string,
      targetFacultyId?: string,
    ): boolean => {
      const hypState = state.cloneWithMove({
        slot,
        target: {
          day: targetDay,
          period: targetPeriod,
          roomId: targetRoomId ?? slot.roomId,
          facultyId: targetFacultyId ?? slot.facultyId,
        },
      });

      for (const constraint of hardConstraints) {
        const viols = constraint.check(hypState);
        if (viols.length > 0) return false;
      }
      return true;
    };

    // 1. If room issue (room double-booked, room capacity, room type), search alternative rooms first
    if (
      violation.constraintId === 'room-no-double-booking' ||
      violation.constraintId === 'room-capacity-fits-section' ||
      violation.constraintId === 'room-type-matches-subject' ||
      violation.constraintId === 'room-availability'
    ) {
      for (const room of state.input.rooms) {
        if (room.id === slot.roomId) continue;

        if (isMoveHardViolationFree(slot.day, slot.period, room.id)) {
          suggestions.push({
            type: 'room',
            roomId: room.id,
            description: `Move class to available room ${room.name} (${room.type}, capacity ${room.capacity}) at current time.`,
            day: slot.day,
            period: slot.period,
            score: 95,
          });

          if (suggestions.length >= maxSuggestions) return suggestions;
        }
      }
    }

    // 2. Search alternative periods (prefer same day first, then other working days)
    const dayOrder = [
      slot.day,
      ...Array.from({ length: daysCount }, (_, i) => i).filter((d) => d !== slot.day),
    ];

    for (const d of dayOrder) {
      for (let p = 1; p <= periodsCount; p++) {
        if (d === slot.day && p === slot.period) continue;

        // Skip break periods
        const isBreak = breaks.some(
          (b) => (b.day === undefined || b.day === d) && b.period === p,
        );
        if (isBreak) continue;

        if (isMoveHardViolationFree(d, p)) {
          const dayName = state.input.settings.days[d] || `Day ${d + 1}`;
          const isSameDay = d === slot.day;

          suggestions.push({
            type: 'period',
            day: d,
            period: p,
            roomId: slot.roomId,
            description: `Reschedule to conflict-free slot on ${dayName} at Period ${p}.`,
            score: isSameDay ? 90 : 75,
          });

          if (suggestions.length >= maxSuggestions) return suggestions;
        }
      }
    }

    // 3. Search combination of alternative period and alternative room
    if (suggestions.length < maxSuggestions) {
      for (const room of state.input.rooms) {
        if (room.id === slot.roomId) continue;

        for (let d = 0; d < daysCount; d++) {
          for (let p = 1; p <= periodsCount; p++) {
            if (isMoveHardViolationFree(d, p, room.id)) {
              const dayName = state.input.settings.days[d] || `Day ${d + 1}`;
              suggestions.push({
                type: 'swap',
                day: d,
                period: p,
                roomId: room.id,
                description: `Move to ${room.name} on ${dayName} at Period ${p}.`,
                score: 60,
              });

              if (suggestions.length >= maxSuggestions) return suggestions;
            }
          }
        }
      }
    }

    return suggestions;
  }
}
