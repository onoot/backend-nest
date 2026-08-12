import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as sharp from 'sharp';
import { MinioService } from '../minio/minio.service';

const COMPRESS_EXT = /\.(jpg|jpeg|png|webp)$/i;
const JPEG_QUALITY = 85;
const MAX_WIDTH = 2560;
const MIME: Record<string, string> = { '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg' };

@Injectable()
export class UploadService {
  constructor(private minio: MinioService) {}

  async uploadPhoto(file: Express.Multer.File): Promise<string> {
    if (!file) throw new BadRequestException('No file provided');

    const ext = path.extname(file.originalname);
    const filename = `${uuid()}${ext}`;

    await this.minio.upload(filename, file.buffer, file.mimetype);
    return filename;
  }

  async deletePhoto(filename: string) {
    const exists = await this.minio.exists(filename);
    if (exists) {
      await this.minio.delete(filename);
    }
  }

  async listPhotos(): Promise<string[]> {
    const files = await this.minio.listFiles();
    const imageExt = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
    return files.filter(f => imageExt.test(f)).sort();
  }

  async getPhoto(filename: string, options: { type?: 'full'; width?: number } = {}): Promise<{ stream: NodeJS.ReadableStream; contentType: string }> {
    let cleanPath = filename.replace(/^\//, '');
    let exists = await this.minio.exists(cleanPath);
    if (!exists) {
      const found = await this.minio.findFile(cleanPath);
      if (!found) throw new NotFoundException('File not found');
      cleanPath = found;
    }

    const ext = path.extname(cleanPath).toLowerCase();
    const pass = (data: Buffer) => new (require('stream').PassThrough)().end(data) as unknown as NodeJS.ReadableStream;

    // Full quality: original file, no recompression (lossless).
    if (options.type === 'full') {
      const stream = await this.minio.getStream(cleanPath);
      return { stream, contentType: MIME[ext] || 'image/jpeg' };
    }

    // Responsive resizing: ?w=width (browser picks one size via srcset → single request).
    if (COMPRESS_EXT.test(ext)) {
      try {
        const width = options.width ? Math.min(Math.max(1, Math.round(options.width)), MAX_WIDTH) : undefined;
        let pipeline = sharp(await this.minio.download(cleanPath)).rotate();
        if (width) pipeline = pipeline.resize({ width, withoutEnlargement: true });
        const out = await pipeline.jpeg({ quality: JPEG_QUALITY, progressive: true }).toBuffer();
        return { stream: pass(out), contentType: 'image/jpeg' };
      } catch {
        // fall through to raw stream on sharp failure
      }
    }

    const stream = await this.minio.getStream(cleanPath);
    return { stream, contentType: MIME[ext] || 'image/jpeg' };
  }
}
