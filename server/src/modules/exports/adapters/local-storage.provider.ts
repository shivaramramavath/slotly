// Storage adapter persisting generated export files to local filesystem.
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import type { IStorageProvider } from './storage-provider.interface';

/** Local disk storage adapter saving exports to uploads/exports directory. */
@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'uploads', 'exports');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async save(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.join(this.baseDir, safeKey);
    const metaPath = `${filePath}.meta.json`;

    await fs.promises.writeFile(filePath, buffer);
    await fs.promises.writeFile(
      metaPath,
      JSON.stringify({ mimeType, savedAt: new Date().toISOString() }),
    );

    this.logger.debug(
      `Saved export artifact "${safeKey}" (${buffer.length} bytes)`,
    );
    return safeKey;
  }

  async get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.join(this.baseDir, safeKey);
    const metaPath = `${filePath}.meta.json`;

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const buffer = await fs.promises.readFile(filePath);
    let mimeType = 'application/octet-stream';
    if (fs.existsSync(metaPath)) {
      try {
        const meta = JSON.parse(await fs.promises.readFile(metaPath, 'utf8'));
        if (meta.mimeType) mimeType = meta.mimeType;
      } catch {
        // ignore
      }
    }

    return { buffer, mimeType };
  }

  async delete(key: string): Promise<boolean> {
    const safeKey = key.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const filePath = path.join(this.baseDir, safeKey);
    const metaPath = `${filePath}.meta.json`;

    let deleted = false;
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      deleted = true;
    }
    if (fs.existsSync(metaPath)) {
      await fs.promises.unlink(metaPath);
    }
    return deleted;
  }
}
