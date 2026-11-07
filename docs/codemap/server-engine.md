# Server Engine Module Code Map

### `server/src/modules/engine/controllers/engine.controller.ts`
*(no description)*

- **Controller** `EngineController` (base: `/`)
  - `POST /projects/:projectId/validate` -> `validateProject()` [perm: 'BLUEPRINT_READ']
  - `POST /versions/:versionId/validate` -> `validateVersion()` [perm: 'PROJECT_READ']

### `server/src/modules/engine/core/constraint.interface.ts`
*(no description)*

- **Interface** `IConstraint`

### `server/src/modules/engine/core/constraint.registry.ts`
*(no description)*

- **Class** `ConstraintRegistry`

### `server/src/modules/engine/core/constraints/hard/break-not-overwritable.constraint.ts`
*(no description)*

- **Class** `BreakNotOverwritableConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/elective-simultaneity.constraint.ts`
*(no description)*

- **Class** `ElectiveSimultaneityConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/equipment-match.constraint.ts`
*(no description)*

- **Class** `EquipmentMatchConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/faculty-availability.constraint.ts`
*(no description)*

- **Class** `FacultyAvailabilityConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/faculty-no-double-booking.constraint.ts`
*(no description)*

- **Class** `FacultyNoDoubleBookingConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/holiday-exclusion.constraint.ts`
*(no description)*

- **Class** `HolidayExclusionConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/index.ts`
*(no description)*

*(No public exports)*

### `server/src/modules/engine/core/constraints/hard/lab-consecutive-block.constraint.ts`
*(no description)*

- **Class** `LabConsecutiveBlockConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/max-classes-per-day.constraint.ts`
*(no description)*

- **Class** `MaxClassesPerDayConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/max-hours-per-day.constraint.ts`
*(no description)*

- **Class** `MaxHoursPerDayConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/max-hours-per-week.constraint.ts`
*(no description)*

- **Class** `MaxHoursPerWeekConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/min-breaks.constraint.ts`
*(no description)*

- **Class** `MinBreaksConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/min-hours-per-week.constraint.ts`
*(no description)*

- **Class** `MinHoursPerWeekConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/missing-allocation.constraint.ts`
*(no description)*

- **Class** `MissingAllocationConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/room-availability.constraint.ts`
*(no description)*

- **Class** `RoomAvailabilityConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/room-capacity-fits-section.constraint.ts`
*(no description)*

- **Class** `RoomCapacityFitsSectionConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/room-no-double-booking.constraint.ts`
*(no description)*

- **Class** `RoomNoDoubleBookingConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/room-type-matches-subject.constraint.ts`
*(no description)*

- **Class** `RoomTypeMatchesSubjectConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/section-availability.constraint.ts`
*(no description)*

- **Class** `SectionAvailabilityConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/section-no-double-booking.constraint.ts`
*(no description)*

- **Class** `SectionNoDoubleBookingConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/hard/weekly-hours-met.constraint.ts`
*(no description)*

- **Class** `WeeklyHoursMetConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/soft/balance-faculty-load.constraint.ts`
*(no description)*

- **Class** `BalanceFacultyLoadConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/soft/department-rules.constraint.ts`
*(no description)*

- **Class** `DepartmentRulesConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/soft/faculty-preferred-periods.constraint.ts`
*(no description)*

- **Class** `FacultyPreferredPeriodsConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/soft/index.ts`
*(no description)*

*(No public exports)*

### `server/src/modules/engine/core/constraints/soft/labs-in-afternoon.constraint.ts`
*(no description)*

- **Class** `LabsInAfternoonConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/soft/limit-consecutive-same-subject.constraint.ts`
*(no description)*

- **Class** `LimitConsecutiveSameSubjectConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/soft/minimize-room-changes.constraint.ts`
*(no description)*

- **Class** `MinimizeRoomChangesConstraint` implements `IConstraint`

### `server/src/modules/engine/core/constraints/soft/spread-subjects-across-days.constraint.ts`
*(no description)*

- **Class** `SpreadSubjectsAcrossDaysConstraint` implements `IConstraint`

### `server/src/modules/engine/core/index.ts`
*(no description)*

*(No public exports)*

### `server/src/modules/engine/core/pre-build.checker.ts`
*(no description)*

- **Class** `PreBuildChecker`

### `server/src/modules/engine/core/schedule-state.ts`
*(no description)*

- **Class** `ScheduleState`

### `server/src/modules/engine/core/solver/alternatives-generator.ts`
*(no description)*

- **Function** `generateAlternatives(input: import("E:/Shiva Ram/Projects/slotly/server/src/modules/engine/core/types").EngineInput, n: number, options: import("E:/Shiva Ram/Projects/slotly/server/src/modules/engine/core/solver/types").SolverOptions)`: `import("E:/Shiva Ram/Projects/slotly/server/src/modules/engine/core/solver/types").AlternativeResult[]` - Generates n distinct, ranked alternative timetable solutions.

### `server/src/modules/engine/core/solver/index.ts`
*(no description)*

*(No public exports)*

### `server/src/modules/engine/core/solver/rng.ts`
*(no description)*

- **Class** `SeededRng` - Deterministic Pseudo-Random Number Generator using Mulberry32.

### `server/src/modules/engine/core/solver/task-builder.ts`
*(no description)*

- **Class** `TaskBuilder`

### `server/src/modules/engine/core/solver/timetable-solver.ts`
*(no description)*

- **Class** `TimetableSolver`

### `server/src/modules/engine/core/solver/types.ts`
*(no description)*

- **Interface** `SolverOptions`
- **Interface** `SolveTask`
- **Interface** `ElectiveTaskBundle`
- **Interface** `SolverResult`
- **Interface** `AlternativeResult`

### `server/src/modules/engine/core/suggestion.strategy.ts`
*(no description)*

- **Class** `SuggestionStrategy`

### `server/src/modules/engine/core/types.ts`
*(no description)*

- **Interface** `EngineSection`
- **Interface** `EngineBatch`
- **Interface** `EngineFaculty`
- **Interface** `EngineRoom`
- **Interface** `EngineSubject`
- **Interface** `EngineElectiveGroup`
- **Interface** `EngineBreak`
- **Interface** `EngineSettings`
- **Interface** `EngineCalendar`
- **Interface** `EngineInput`
- **Interface** `Move`
- **Type** `Slot`
- **Type** `Violation`

### `server/src/modules/engine/core/validation.service.ts`
*(no description)*

- **Class** `ValidationService`

### `server/src/modules/engine/engine.module.ts`
*(no description)*

- **Class** `EngineModule`

### `server/src/modules/engine/services/engine-validation.service.ts`
*(no description)*

- **Injectable** `EngineValidationService` (deps: @Inject(CACHE_SERVICE), @Inject(forwardRef(() => BlueprintService)), @Inject(forwardRef(() => ProjectsService)))

