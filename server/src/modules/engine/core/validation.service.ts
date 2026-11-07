import type { EngineInput, Slot, Violation, ValidationReportDto } from './types';
import { ScheduleState } from './schedule-state';
import { ConstraintRegistry } from './constraint.registry';
import { SuggestionStrategy } from './suggestion.strategy';
import { PreBuildChecker } from './pre-build.checker';
import {
  FacultyNoDoubleBookingConstraint,
  RoomNoDoubleBookingConstraint,
  SectionNoDoubleBookingConstraint,
  FacultyAvailabilityConstraint,
  RoomAvailabilityConstraint,
  SectionAvailabilityConstraint,
  MaxHoursPerDayConstraint,
  MaxHoursPerWeekConstraint,
  MinHoursPerWeekConstraint,
  MaxClassesPerDayConstraint,
  MinBreaksConstraint,
  RoomCapacityFitsSectionConstraint,
  RoomTypeMatchesSubjectConstraint,
  EquipmentMatchConstraint,
  LabConsecutiveBlockConstraint,
  ElectiveSimultaneityConstraint,
  HolidayExclusionConstraint,
  WeeklyHoursMetConstraint,
  MissingAllocationConstraint,
  BreakNotOverwritableConstraint,
} from './constraints/hard';
import {
  FacultyPreferredPeriodsConstraint,
  SpreadSubjectsAcrossDaysConstraint,
  LimitConsecutiveSameSubjectConstraint,
  BalanceFacultyLoadConstraint,
  LabsInAfternoonConstraint,
  MinimizeRoomChangesConstraint,
  DepartmentRulesConstraint,
} from './constraints/soft';

export class ValidationService {
  private readonly registry: ConstraintRegistry;
  private readonly suggestionStrategy: SuggestionStrategy;
  private readonly preBuildChecker: PreBuildChecker;

  constructor(customRegistry?: ConstraintRegistry) {
    if (customRegistry) {
      this.registry = customRegistry;
    } else {
      this.registry = new ConstraintRegistry();
      this.registerDefaultConstraints();
    }

    this.suggestionStrategy = new SuggestionStrategy(this.registry);
    this.preBuildChecker = new PreBuildChecker();
  }

  getRegistry(): ConstraintRegistry {
    return this.registry;
  }

  /**
   * Registers all 20 hard and 7 soft default constraints into the registry.
   */
  private registerDefaultConstraints(): void {
    // 20 Hard Constraints
    this.registry.register(new FacultyNoDoubleBookingConstraint());
    this.registry.register(new RoomNoDoubleBookingConstraint());
    this.registry.register(new SectionNoDoubleBookingConstraint());
    this.registry.register(new FacultyAvailabilityConstraint());
    this.registry.register(new RoomAvailabilityConstraint());
    this.registry.register(new SectionAvailabilityConstraint());
    this.registry.register(new MaxHoursPerDayConstraint());
    this.registry.register(new MaxHoursPerWeekConstraint());
    this.registry.register(new MinHoursPerWeekConstraint());
    this.registry.register(new MaxClassesPerDayConstraint());
    this.registry.register(new MinBreaksConstraint());
    this.registry.register(new RoomCapacityFitsSectionConstraint());
    this.registry.register(new RoomTypeMatchesSubjectConstraint());
    this.registry.register(new EquipmentMatchConstraint());
    this.registry.register(new LabConsecutiveBlockConstraint());
    this.registry.register(new ElectiveSimultaneityConstraint());
    this.registry.register(new HolidayExclusionConstraint());
    this.registry.register(new WeeklyHoursMetConstraint());
    this.registry.register(new MissingAllocationConstraint());
    this.registry.register(new BreakNotOverwritableConstraint());

    // 7 Soft Constraints
    this.registry.register(new FacultyPreferredPeriodsConstraint());
    this.registry.register(new SpreadSubjectsAcrossDaysConstraint());
    this.registry.register(new LimitConsecutiveSameSubjectConstraint());
    this.registry.register(new BalanceFacultyLoadConstraint());
    this.registry.register(new LabsInAfternoonConstraint());
    this.registry.register(new MinimizeRoomChangesConstraint());
    this.registry.register(new DepartmentRulesConstraint());
  }

  /**
   * Validates schedule state against all registered constraints and runs pre-build integrity checks.
   */
  validate(input: EngineInput, slots: Slot[]): ValidationReportDto {
    const state = new ScheduleState(input, slots);
    const violations: Violation[] = [];

    // Evaluate each constraint from registry
    for (const constraint of this.registry.getAll()) {
      const constraintViolations = constraint.check(state);

      for (const viol of constraintViolations) {
        // Generate ranked conflict-free alternative suggestions for hard violations
        if (viol.type === 'hard' && viol.slotRefs.length > 0) {
          viol.suggestions = this.suggestionStrategy.generateSuggestions(state, viol);
        }
        violations.push(viol);
      }
    }

    const preBuildErrors = this.preBuildChecker.check(input);

    const hardViolationsCount = violations.filter((v) => v.type === 'hard').length;
    const softViolationsCount = violations.filter((v) => v.type === 'soft').length;

    // Calculate score: 100 base score
    // -25 per hard violation
    // -2 per soft violation
    let calculatedScore = 100 - hardViolationsCount * 25 - softViolationsCount * 2;
    if (preBuildErrors.length > 0) {
      calculatedScore -= preBuildErrors.length * 15;
    }
    calculatedScore = Math.max(0, Math.min(100, calculatedScore));

    const valid = hardViolationsCount === 0 && preBuildErrors.length === 0;

    return {
      valid,
      score: calculatedScore,
      hardViolationsCount,
      softViolationsCount,
      violations,
      preBuildErrors,
      validatedAt: new Date().toISOString(),
    };
  }
}
