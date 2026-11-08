# Engine Module & Library Code Map

### `packages/engine/src/constraint.interface.ts`
*Core implementation for constraint.interface in packages/engine/src.*

- **Interface** `IConstraint` - Interface defining structure for constraint.

### `packages/engine/src/constraint.registry.ts`
*Core implementation for constraint.registry in packages/engine/src.*

- **Class** `ConstraintRegistry` - Class implementing constraint registry.

### `packages/engine/src/constraints/hard/break-not-overwritable.constraint.ts`
*Core implementation for break-not-overwritable.constraint in packages/engine/src/constraints/hard.*

- **Class** `BreakNotOverwritableConstraint` implements `IConstraint` - Class implementing break not overwritable constraint.

### `packages/engine/src/constraints/hard/elective-simultaneity.constraint.ts`
*Core implementation for elective-simultaneity.constraint in packages/engine/src/constraints/hard.*

- **Class** `ElectiveSimultaneityConstraint` implements `IConstraint` - Class implementing elective simultaneity constraint.

### `packages/engine/src/constraints/hard/equipment-match.constraint.ts`
*Core implementation for equipment-match.constraint in packages/engine/src/constraints/hard.*

- **Class** `EquipmentMatchConstraint` implements `IConstraint` - Class implementing equipment match constraint.

### `packages/engine/src/constraints/hard/faculty-availability.constraint.ts`
*Core implementation for faculty-availability.constraint in packages/engine/src/constraints/hard.*

- **Class** `FacultyAvailabilityConstraint` implements `IConstraint` - Class implementing faculty availability constraint.

### `packages/engine/src/constraints/hard/faculty-no-double-booking.constraint.ts`
*Core implementation for faculty-no-double-booking.constraint in packages/engine/src/constraints/hard.*

- **Class** `FacultyNoDoubleBookingConstraint` implements `IConstraint` - Class implementing faculty no double booking constraint.

### `packages/engine/src/constraints/hard/holiday-exclusion.constraint.ts`
*Core implementation for holiday-exclusion.constraint in packages/engine/src/constraints/hard.*

- **Class** `HolidayExclusionConstraint` implements `IConstraint` - Class implementing holiday exclusion constraint.

### `packages/engine/src/constraints/hard/index.ts`
*Core implementation for index in packages/engine/src/constraints/hard.*

*(No public exports)*

### `packages/engine/src/constraints/hard/lab-consecutive-block.constraint.ts`
*Core implementation for lab-consecutive-block.constraint in packages/engine/src/constraints/hard.*

- **Class** `LabConsecutiveBlockConstraint` implements `IConstraint` - Class implementing lab consecutive block constraint.

### `packages/engine/src/constraints/hard/max-classes-per-day.constraint.ts`
*Core implementation for max-classes-per-day.constraint in packages/engine/src/constraints/hard.*

- **Class** `MaxClassesPerDayConstraint` implements `IConstraint` - Class implementing max classes per day constraint.

### `packages/engine/src/constraints/hard/max-hours-per-day.constraint.ts`
*Core implementation for max-hours-per-day.constraint in packages/engine/src/constraints/hard.*

- **Class** `MaxHoursPerDayConstraint` implements `IConstraint` - Class implementing max hours per day constraint.

### `packages/engine/src/constraints/hard/max-hours-per-week.constraint.ts`
*Core implementation for max-hours-per-week.constraint in packages/engine/src/constraints/hard.*

- **Class** `MaxHoursPerWeekConstraint` implements `IConstraint` - Class implementing max hours per week constraint.

### `packages/engine/src/constraints/hard/min-breaks.constraint.ts`
*Core implementation for min-breaks.constraint in packages/engine/src/constraints/hard.*

- **Class** `MinBreaksConstraint` implements `IConstraint` - Class implementing min breaks constraint.

### `packages/engine/src/constraints/hard/min-hours-per-week.constraint.ts`
*Core implementation for min-hours-per-week.constraint in packages/engine/src/constraints/hard.*

- **Class** `MinHoursPerWeekConstraint` implements `IConstraint` - Class implementing min hours per week constraint.

### `packages/engine/src/constraints/hard/missing-allocation.constraint.ts`
*Core implementation for missing-allocation.constraint in packages/engine/src/constraints/hard.*

- **Class** `MissingAllocationConstraint` implements `IConstraint` - Class implementing missing allocation constraint.

### `packages/engine/src/constraints/hard/room-availability.constraint.ts`
*Core implementation for room-availability.constraint in packages/engine/src/constraints/hard.*

- **Class** `RoomAvailabilityConstraint` implements `IConstraint` - Class implementing room availability constraint.

### `packages/engine/src/constraints/hard/room-capacity-fits-section.constraint.ts`
*Core implementation for room-capacity-fits-section.constraint in packages/engine/src/constraints/hard.*

- **Class** `RoomCapacityFitsSectionConstraint` implements `IConstraint` - Class implementing room capacity fits section constraint.

### `packages/engine/src/constraints/hard/room-no-double-booking.constraint.ts`
*Core implementation for room-no-double-booking.constraint in packages/engine/src/constraints/hard.*

- **Class** `RoomNoDoubleBookingConstraint` implements `IConstraint` - Class implementing room no double booking constraint.

### `packages/engine/src/constraints/hard/room-type-matches-subject.constraint.ts`
*Core implementation for room-type-matches-subject.constraint in packages/engine/src/constraints/hard.*

- **Class** `RoomTypeMatchesSubjectConstraint` implements `IConstraint` - Class implementing room type matches subject constraint.

### `packages/engine/src/constraints/hard/section-availability.constraint.ts`
*Core implementation for section-availability.constraint in packages/engine/src/constraints/hard.*

- **Class** `SectionAvailabilityConstraint` implements `IConstraint` - Class implementing section availability constraint.

### `packages/engine/src/constraints/hard/section-no-double-booking.constraint.ts`
*Core implementation for section-no-double-booking.constraint in packages/engine/src/constraints/hard.*

- **Class** `SectionNoDoubleBookingConstraint` implements `IConstraint` - Class implementing section no double booking constraint.

### `packages/engine/src/constraints/hard/weekly-hours-met.constraint.ts`
*Core implementation for weekly-hours-met.constraint in packages/engine/src/constraints/hard.*

- **Class** `WeeklyHoursMetConstraint` implements `IConstraint` - Class implementing weekly hours met constraint.

### `packages/engine/src/constraints/soft/balance-faculty-load.constraint.ts`
*Core implementation for balance-faculty-load.constraint in packages/engine/src/constraints/soft.*

- **Class** `BalanceFacultyLoadConstraint` implements `IConstraint` - Class implementing balance faculty load constraint.

### `packages/engine/src/constraints/soft/department-rules.constraint.ts`
*Core implementation for department-rules.constraint in packages/engine/src/constraints/soft.*

- **Class** `DepartmentRulesConstraint` implements `IConstraint` - Class implementing department rules constraint.

### `packages/engine/src/constraints/soft/faculty-preferred-periods.constraint.ts`
*Core implementation for faculty-preferred-periods.constraint in packages/engine/src/constraints/soft.*

- **Class** `FacultyPreferredPeriodsConstraint` implements `IConstraint` - Class implementing faculty preferred periods constraint.

### `packages/engine/src/constraints/soft/index.ts`
*Core implementation for index in packages/engine/src/constraints/soft.*

*(No public exports)*

### `packages/engine/src/constraints/soft/labs-in-afternoon.constraint.ts`
*Core implementation for labs-in-afternoon.constraint in packages/engine/src/constraints/soft.*

- **Class** `LabsInAfternoonConstraint` implements `IConstraint` - Class implementing labs in afternoon constraint.

### `packages/engine/src/constraints/soft/limit-consecutive-same-subject.constraint.ts`
*Core implementation for limit-consecutive-same-subject.constraint in packages/engine/src/constraints/soft.*

- **Class** `LimitConsecutiveSameSubjectConstraint` implements `IConstraint` - Class implementing limit consecutive same subject constraint.

### `packages/engine/src/constraints/soft/minimize-room-changes.constraint.ts`
*Core implementation for minimize-room-changes.constraint in packages/engine/src/constraints/soft.*

- **Class** `MinimizeRoomChangesConstraint` implements `IConstraint` - Class implementing minimize room changes constraint.

### `packages/engine/src/constraints/soft/spread-subjects-across-days.constraint.ts`
*Core implementation for spread-subjects-across-days.constraint in packages/engine/src/constraints/soft.*

- **Class** `SpreadSubjectsAcrossDaysConstraint` implements `IConstraint` - Class implementing spread subjects across days constraint.

### `packages/engine/src/index.ts`
*Main entry point for @slotly/engine library.*

*(No public exports)*

### `packages/engine/src/pre-build.checker.ts`
*Core implementation for pre-build.checker in packages/engine/src.*

- **Class** `PreBuildChecker` - Class implementing pre build checker.

### `packages/engine/src/schedule-state.ts`
*Core implementation for schedule-state in packages/engine/src.*

- **Class** `ScheduleState` - Class implementing schedule state.

### `packages/engine/src/suggestion.strategy.ts`
*Strategy implementation for suggestion.strategy.*

- **Class** `SuggestionStrategy` - Class implementing suggestion strategy.

### `packages/engine/src/types.ts`
*Core implementation for types in packages/engine/src.*

- **Interface** `EngineSection` - Interface defining structure for engine section.
- **Interface** `EngineBatch` - Interface defining structure for engine batch.
- **Interface** `EngineFaculty` - Interface defining structure for engine faculty.
- **Interface** `EngineRoom` - Interface defining structure for engine room.
- **Interface** `EngineSubject` - Interface defining structure for engine subject.
- **Interface** `EngineElectiveGroup` - Interface defining structure for engine elective group.
- **Interface** `EngineBreak` - Interface defining structure for engine break.
- **Interface** `EngineSettings` - Interface defining structure for engine settings.
- **Interface** `EngineCalendar` - Interface defining structure for engine calendar.
- **Interface** `EngineInput` - Interface defining structure for engine input.
- **Interface** `Move` - Interface defining structure for move.
- **Type** `Slot` - Type alias for slot.
- **Type** `Violation` - Type alias for violation.

### `packages/engine/src/validation.service.ts`
*Domain service orchestrating validation.service business logic.*

- **Class** `ValidationService` - Class implementing validation service.

### `server/src/modules/engine/controllers/engine.controller.ts`
*HTTP controller handling engine.controller endpoints.*

- **Controller** `EngineController` (base: `/`) - Controller handling engine controller HTTP endpoints.
  - `POST /projects/:projectId/validate` -> `validateProject()` [perm: 'BLUEPRINT_READ']
  - `POST /versions/:versionId/validate` -> `validateVersion()` [perm: 'PROJECT_READ']

### `server/src/modules/engine/core/index.ts`
*Core implementation for index in server/src/modules/engine/core.*

*(No public exports)*

### `server/src/modules/engine/core/solver/alternatives-generator.ts`
*Core implementation for alternatives-generator in server/src/modules/engine/core/solver.*

- **Function** `generateAlternatives(input: import("E:/Shiva Ram/Projects/slotly/packages/engine/dist/index").EngineInput, n: number, options: import("E:/Shiva Ram/Projects/slotly/server/src/modules/engine/core/solver/types").SolverOptions)`: `import("E:/Shiva Ram/Projects/slotly/server/src/modules/engine/core/solver/types").AlternativeResult[]` - Generates n distinct, ranked alternative timetable solutions.

### `server/src/modules/engine/core/solver/index.ts`
*Core implementation for index in server/src/modules/engine/core/solver.*

*(No public exports)*

### `server/src/modules/engine/core/solver/rng.ts`
*Core implementation for rng in server/src/modules/engine/core/solver.*

- **Class** `SeededRng` - Deterministic Pseudo-Random Number Generator using Mulberry32.

### `server/src/modules/engine/core/solver/task-builder.ts`
*Core implementation for task-builder in server/src/modules/engine/core/solver.*

- **Class** `TaskBuilder` - Class implementing task builder.

### `server/src/modules/engine/core/solver/timetable-solver.ts`
*Core implementation for timetable-solver in server/src/modules/engine/core/solver.*

- **Class** `TimetableSolver` - Class implementing timetable solver.

### `server/src/modules/engine/core/solver/types.ts`
*Core implementation for types in server/src/modules/engine/core/solver.*

- **Interface** `SolverOptions` - Interface defining structure for solver options.
- **Interface** `SolveTask` - Interface defining structure for solve task.
- **Interface** `ElectiveTaskBundle` - Interface defining structure for elective task bundle.
- **Interface** `SolverResult` - Interface defining structure for solver result.
- **Interface** `AlternativeResult` - Interface defining structure for alternative result.

### `server/src/modules/engine/engine.module.ts`
*Core implementation for engine.module in server/src/modules/engine.*

- **Class** `EngineModule` - Class implementing engine module.

### `server/src/modules/engine/services/engine-validation.service.ts`
*Domain service orchestrating engine-validation.service business logic.*

- **Injectable** `EngineValidationService` (deps: @Inject(CACHE_SERVICE), @Inject(forwardRef(() => BlueprintService)), @Inject(forwardRef(() => ProjectsService))) - Injectable service providing engine validation service logic.

