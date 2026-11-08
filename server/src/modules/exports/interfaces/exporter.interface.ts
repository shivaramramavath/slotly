// Strategy interface and data structures for polymorphic timetable exporters.
import type {
  ExportFormat,
  ProjectSettings,
  ScheduleEntryDto,
} from '@slotly/contracts';

/** Data bundle passed to timetable exporters. */
export interface ExportData {
  title: string;
  projectName: string;
  entityType: string;
  entityName: string;
  settings: ProjectSettings;
  entries: ScheduleEntryDto[];
  day?: number | undefined;
}

/** Strategy interface defining polymorphic timetable export contracts. */
export interface IExporter {
  readonly format: ExportFormat;
  readonly mimeType: string;
  readonly fileExtension: string;

  /** Generates a complete binary or text buffer representation of the timetable. */
  export(data: ExportData): Promise<Buffer>;
}
