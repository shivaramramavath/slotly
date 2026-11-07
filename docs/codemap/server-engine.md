# Server Engine Module Code Map

### `server/src/modules/engine/controllers/engine.controller.ts`
*HTTP controller handling engine.controller endpoints.*

- **Controller** `EngineController` (base: `/`) - Controller handling engine controller HTTP endpoints.
  - `POST /projects/:projectId/validate` -> `validateProject()` [perm: 'BLUEPRINT_READ']
  - `POST /versions/:versionId/validate` -> `validateVersion()` [perm: 'PROJECT_READ']

### `server/src/modules/engine/core/constraint.interface.ts`
*Core implementation for constraint.interface in server/src/modules/engine/core.*

- **Interface** `IConstraint` - Interface defining structure for constraint.

### `server/src/modules/engine/core/constraint.registry.ts`
*Core implementation for constraint.registry in server/src/modules/engine/core.*

- **Class** `ConstraintRegistry` - Class implementing constraint registry.

### `server/src/modules/engine/core/constraints/hard/break-not-overwritable.constraint.ts`
*Core implementation for break-not-overwritable.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `BreakNotOverwritableConstraint` implements `IConstraint` - Class implementing break not overwritable constraint.

### `server/src/modules/engine/core/constraints/hard/elective-simultaneity.constraint.ts`
*Core implementation for elective-simultaneity.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `ElectiveSimultaneityConstraint` implements `IConstraint` - Class implementing elective simultaneity constraint.

### `server/src/modules/engine/core/constraints/hard/equipment-match.constraint.ts`
*Core implementation for equipment-match.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `EquipmentMatchConstraint` implements `IConstraint` - Class implementing equipment match constraint.

### `server/src/modules/engine/core/constraints/hard/faculty-availability.constraint.ts`
*Core implementation for faculty-availability.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `FacultyAvailabilityConstraint` implements `IConstraint` - Class implementing faculty availability constraint.

### `server/src/modules/engine/core/constraints/hard/faculty-no-double-booking.constraint.ts`
*Core implementation for faculty-no-double-booking.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `FacultyNoDoubleBookingConstraint` implements `IConstraint` - Class implementing faculty no double booking constraint.

### `server/src/modules/engine/core/constraints/hard/holiday-exclusion.constraint.ts`
*Core implementation for holiday-exclusion.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `HolidayExclusionConstraint` implements `IConstraint` - Class implementing holiday exclusion constraint.

### `server/src/modules/engine/core/constraints/hard/index.ts`
*Core implementation for index in server/src/modules/engine/core/constraints/hard.*

*(No public exports)*

### `server/src/modules/engine/core/constraints/hard/lab-consecutive-block.constraint.ts`
*Core implementation for lab-consecutive-block.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `LabConsecutiveBlockConstraint` implements `IConstraint` - Class implementing lab consecutive block constraint.

### `server/src/modules/engine/core/constraints/hard/max-classes-per-day.constraint.ts`
*Core implementation for max-classes-per-day.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `MaxClassesPerDayConstraint` implements `IConstraint` - Class implementing max classes per day constraint.

### `server/src/modules/engine/core/constraints/hard/max-hours-per-day.constraint.ts`
*Core implementation for max-hours-per-day.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `MaxHoursPerDayConstraint` implements `IConstraint` - Class implementing max hours per day constraint.

### `server/src/modules/engine/core/constraints/hard/max-hours-per-week.constraint.ts`
*Core implementation for max-hours-per-week.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `MaxHoursPerWeekConstraint` implements `IConstraint` - Class implementing max hours per week constraint.

### `server/src/modules/engine/core/constraints/hard/min-breaks.constraint.ts`
*Core implementation for min-breaks.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `MinBreaksConstraint` implements `IConstraint` - Class implementing min breaks constraint.

### `server/src/modules/engine/core/constraints/hard/min-hours-per-week.constraint.ts`
*Core implementation for min-hours-per-week.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `MinHoursPerWeekConstraint` implements `IConstraint` - Class implementing min hours per week constraint.

### `server/src/modules/engine/core/constraints/hard/missing-allocation.constraint.ts`
*Core implementation for missing-allocation.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `MissingAllocationConstraint` implements `IConstraint` - Class implementing missing allocation constraint.

### `server/src/modules/engine/core/constraints/hard/room-availability.constraint.ts`
*Core implementation for room-availability.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `RoomAvailabilityConstraint` implements `IConstraint` - Class implementing room availability constraint.

### `server/src/modules/engine/core/constraints/hard/room-capacity-fits-section.constraint.ts`
*Core implementation for room-capacity-fits-section.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `RoomCapacityFitsSectionConstraint` implements `IConstraint` - Class implementing room capacity fits section constraint.

### `server/src/modules/engine/core/constraints/hard/room-no-double-booking.constraint.ts`
*Core implementation for room-no-double-booking.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `RoomNoDoubleBookingConstraint` implements `IConstraint` - Class implementing room no double booking constraint.

### `server/src/modules/engine/core/constraints/hard/room-type-matches-subject.constraint.ts`
*Core implementation for room-type-matches-subject.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `RoomTypeMatchesSubjectConstraint` implements `IConstraint` - Class implementing room type matches subject constraint.

### `server/src/modules/engine/core/constraints/hard/section-availability.constraint.ts`
*Core implementation for section-availability.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `SectionAvailabilityConstraint` implements `IConstraint` - Class implementing section availability constraint.

### `server/src/modules/engine/core/constraints/hard/section-no-double-booking.constraint.ts`
*Core implementation for section-no-double-booking.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `SectionNoDoubleBookingConstraint` implements `IConstraint` - Class implementing section no double booking constraint.

### `server/src/modules/engine/core/constraints/hard/weekly-hours-met.constraint.ts`
*Core implementation for weekly-hours-met.constraint in server/src/modules/engine/core/constraints/hard.*

- **Class** `WeeklyHoursMetConstraint` implements `IConstraint` - Class implementing weekly hours met constraint.

### `server/src/modules/engine/core/constraints/soft/balance-faculty-load.constraint.ts`
*Core implementation for balance-faculty-load.constraint in server/src/modules/engine/core/constraints/soft.*

- **Class** `BalanceFacultyLoadConstraint` implements `IConstraint` - Class implementing balance faculty load constraint.

### `server/src/modules/engine/core/constraints/soft/department-rules.constraint.ts`
*Core implementation for department-rules.constraint in server/src/modules/engine/core/constraints/soft.*

- **Class** `DepartmentRulesConstraint` implements `IConstraint` - Class implementing department rules constraint.

### `server/src/modules/engine/core/constraints/soft/faculty-preferred-periods.constraint.ts`
*Core implementation for faculty-preferred-periods.constraint in server/src/modules/engine/core/constraints/soft.*

- **Class** `FacultyPreferredPeriodsConstraint` implements `IConstraint` - Class implementing faculty preferred periods constraint.

### `server/src/modules/engine/core/constraints/soft/index.ts`
*Core implementation for index in server/src/modules/engine/core/constraints/soft.*

*(No public exports)*

### `server/src/modules/engine/core/constraints/soft/labs-in-afternoon.constraint.ts`
*Core implementation for labs-in-afternoon.constraint in server/src/modules/engine/core/constraints/soft.*

- **Class** `LabsInAfternoonConstraint` implements `IConstraint` - Class implementing labs in afternoon constraint.

### `server/src/modules/engine/core/constraints/soft/limit-consecutive-same-subject.constraint.ts`
*Core implementation for limit-consecutive-same-subject.constraint in server/src/modules/engine/core/constraints/soft.*

- **Class** `LimitConsecutiveSameSubjectConstraint` implements `IConstraint` - Class implementing limit consecutive same subject constraint.

### `server/src/modules/engine/core/constraints/soft/minimize-room-changes.constraint.ts`
*Core implementation for minimize-room-changes.constraint in server/src/modules/engine/core/constraints/soft.*

- **Class** `MinimizeRoomChangesConstraint` implements `IConstraint` - Class implementing minimize room changes constraint.

### `server/src/modules/engine/core/constraints/soft/spread-subjects-across-days.constraint.ts`
*Core implementation for spread-subjects-across-days.constraint in server/src/modules/engine/core/constraints/soft.*

- **Class** `SpreadSubjectsAcrossDaysConstraint` implements `IConstraint` - Class implementing spread subjects across days constraint.

### `server/src/modules/engine/core/index.ts`
*Core implementation for index in server/src/modules/engine/core.*

*(No public exports)*

### `server/src/modules/engine/core/pre-build.checker.ts`
*Core implementation for pre-build.checker in server/src/modules/engine/core.*

- **Class** `PreBuildChecker` - Class implementing pre build checker.

### `server/src/modules/engine/core/schedule-state.ts`
*Core implementation for schedule-state in server/src/modules/engine/core.*

- **Class** `ScheduleState` - Class implementing schedule state.

### `server/src/modules/engine/core/solver/alternatives-generator.ts`
*Core implementation for alternatives-generator in server/src/modules/engine/core/solver.*

- **Function** `generateAlternatives(input: import("E:/Shiva Ram/Projects/slotly/server/src/modules/engine/core/types").EngineInput, n: number, options: import("E:/Shiva Ram/Projects/slotly/server/src/modules/engine/core/solver/types").SolverOptions)`: `import("E:/Shiva Ram/Projects/slotly/server/src/modules/engine/core/solver/types").AlternativeResult[]` - Generates n distinct, ranked alternative timetable solutions.

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

### `server/src/modules/engine/core/suggestion.strategy.ts`
*Strategy implementation for suggestion.strategy.*

- **Class** `SuggestionStrategy` - Class implementing suggestion strategy.

### `server/src/modules/engine/core/types.ts`
*Core implementation for types in server/src/modules/engine/core.*

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

### `server/src/modules/engine/core/validation.service.ts`
*Domain service orchestrating validation.service business logic.*

- **Class** `ValidationService` - Class implementing validation service.

### `server/src/modules/engine/engine.module.ts`
*Core implementation for engine.module in server/src/modules/engine.*

- **Class** `EngineModule` - Class implementing engine module.

### `server/src/modules/engine/services/engine-validation.service.ts`
*Domain service orchestrating engine-validation.service business logic.*

- **Injectable** `EngineValidationService` (deps: @Inject(CACHE_SERVICE), @Inject(forwardRef(() => BlueprintService)), @Inject(forwardRef(() => ProjectsService))) - Injectable service providing engine validation service logic.

