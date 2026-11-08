// Exporter strategy rendering raster PNG timetable grid images via pngjs.
import { Injectable } from '@nestjs/common';
import { PNG } from 'pngjs';
import type { ExportFormat } from '@slotly/contracts';
import type {
  IExporter,
  ExportData,
} from '../../interfaces/exporter.interface';

/** Strategy implementation generating raster PNG timetable images. */
@Injectable()
export class ImageExporter implements IExporter {
  readonly format: ExportFormat = 'image';
  readonly mimeType = 'image/png';
  readonly fileExtension = 'png';

  async export(data: ExportData): Promise<Buffer> {
    const activeDays =
      typeof data.day === 'number'
        ? [data.day]
        : data.settings.days || [1, 2, 3, 4, 5];
    const periodsCount = data.settings.periodsPerDay || 7;

    const width = 900;
    const headerHeight = 70;
    const rowHeight = 60;
    const height = headerHeight + activeDays.length * rowHeight + 30;

    const png = new PNG({ width, height });

    // Helper: fill rectangle
    const fillRect = (
      rx: number,
      ry: number,
      rw: number,
      rh: number,
      r: number,
      g: number,
      b: number,
      a = 255,
    ) => {
      const maxX = Math.min(width, rx + rw);
      const maxY = Math.min(height, ry + rh);
      for (let y = Math.max(0, ry); y < maxY; y++) {
        for (let x = Math.max(0, rx); x < maxX; x++) {
          const idx = (width * y + x) << 2;
          png.data[idx] = r;
          png.data[idx + 1] = g;
          png.data[idx + 2] = b;
          png.data[idx + 3] = a;
        }
      }
    };

    // 1. Fill background (dark / surface #0A0A0A)
    fillRect(0, 0, width, height, 10, 10, 10);

    // 2. Header banner (#111111)
    fillRect(20, 15, width - 40, 45, 17, 17, 17);

    // 3. Grid dimensions
    const startX = 20;
    let startY = 75;
    const dayColWidth = 100;
    const periodColWidth = Math.floor(
      (width - 40 - dayColWidth) / periodsCount,
    );

    // Draw period header column cells
    fillRect(startX, startY, dayColWidth, 25, 24, 24, 24);
    for (let p = 1; p <= periodsCount; p++) {
      const colX = startX + dayColWidth + (p - 1) * periodColWidth;
      fillRect(colX, startY, periodColWidth - 2, 25, 24, 24, 24);
    }
    startY += 28;

    // Draw rows for each active day
    for (const d of activeDays) {
      // Day label cell
      fillRect(startX, startY, dayColWidth, rowHeight - 4, 30, 30, 30);

      // Period cells
      for (let p = 1; p <= periodsCount; p++) {
        const colX = startX + dayColWidth + (p - 1) * periodColWidth;
        const entry = data.entries.find(
          (e) => e.day === d && e.startPeriod === p,
        );

        if (entry) {
          // Highlighted lecture/lab cell (#FACC15 accent tint or #222222 with colored top stripe)
          fillRect(colX, startY, periodColWidth - 2, rowHeight - 4, 24, 24, 24);
          fillRect(colX, startY, periodColWidth - 2, 4, 250, 204, 21); // yellow accent bar
        } else {
          // Empty period cell (#151515)
          fillRect(colX, startY, periodColWidth - 2, rowHeight - 4, 18, 18, 18);
        }
      }
      startY += rowHeight;
    }

    return PNG.sync.write(png);
  }
}
