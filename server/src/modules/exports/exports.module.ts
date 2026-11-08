// NestJS module configuring timetable export strategies, factory, facade, storage, and queue processor.
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ExportsController } from './controllers/exports.controller';
import { ExportFacade } from './services/export.facade';
import { ExporterFactory } from './services/exporter.factory';
import { PdfExporter } from './services/exporters/pdf.exporter';
import { ExcelExporter } from './services/exporters/excel.exporter';
import { ImageExporter } from './services/exporters/image.exporter';
import { IcsExporter } from './services/exporters/ics.exporter';
import { STORAGE_PROVIDER } from './adapters/storage-provider.interface';
import { LocalStorageProvider } from './adapters/local-storage.provider';
import { ExportProcessor } from './processors/export.processor';
import { ViewerModule } from '../viewer/viewer.module';
import { ProjectsModule } from '../projects/projects.module';

/** NestJS module managing timetable exports. */
@Module({
  imports: [
    BullModule.registerQueue({ name: 'exports' }),
    ViewerModule,
    ProjectsModule,
  ],
  controllers: [ExportsController],
  providers: [
    PdfExporter,
    ExcelExporter,
    ImageExporter,
    IcsExporter,
    ExporterFactory,
    {
      provide: STORAGE_PROVIDER,
      useClass: LocalStorageProvider,
    },
    ExportFacade,
    ExportProcessor,
  ],
  exports: [ExportFacade, ExporterFactory],
})
export class ExportsModule {}
