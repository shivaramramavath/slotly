// Factory service providing format-driven exporter resolution.
import { Injectable, BadRequestException } from '@nestjs/common';
import type { ExportFormat } from '@slotly/contracts';
import type { IExporter } from '../interfaces/exporter.interface';
import { PdfExporter } from './exporters/pdf.exporter';
import { ExcelExporter } from './exporters/excel.exporter';
import { ImageExporter } from './exporters/image.exporter';
import { IcsExporter } from './exporters/ics.exporter';

/** Factory resolving the appropriate exporter strategy instance by format. */
@Injectable()
export class ExporterFactory {
  private readonly registry = new Map<ExportFormat, IExporter>();

  constructor(
    pdfExporter: PdfExporter,
    excelExporter: ExcelExporter,
    imageExporter: ImageExporter,
    icsExporter: IcsExporter,
  ) {
    this.registry.set('pdf', pdfExporter);
    this.registry.set('excel', excelExporter);
    this.registry.set('image', imageExporter);
    this.registry.set('ics', icsExporter);
  }

  /** Resolves exporter strategy by requested format. */
  getExporter(format: ExportFormat): IExporter {
    const exporter = this.registry.get(format);
    if (!exporter) {
      throw new BadRequestException(`Unsupported export format "${format}"`);
    }
    return exporter;
  }
}
