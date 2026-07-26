import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as sharp from 'sharp';
import { MinioService } from '../minio/minio.service';

const COMPRESS_EXT = /\.(jpg|jpeg|png|webp)$/i;
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 70;

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

  async getPhoto(filename: string): Promise<{ stream: NodeJS.ReadableStream; contentType: string }> {
    let cleanPath = filename.replace(/^\//, '');
    let exists = await this.minio.exists(cleanPath);
    if (!exists) {
      const found = await this.minio.findFile(cleanPath);
      if (!found) throw new NotFoundException('File not found');
      cleanPath = found;
    }

    const buffer = await this.minio.download(cleanPath);
    const ext = path.extname(cleanPath).toLowerCase();

    if (COMPRESS_EXT.test(ext)) {
      try {
        const compressed = await sharp(buffer)
          .resize({ width: MAX_WIDTH, withoutEnlargement: true })
          .jpeg({ quality: JPEG_QUALITY, progressive: true })
          .toBuffer();
        return {
          stream: new (require('stream').PassThrough)().end(compressed) as unknown as NodeJS.ReadableStream,
          contentType: 'image/jpeg',
        };
      } catch {
        // fall through to raw stream on sharp failure
      }
    }

    const stream = await this.minio.getStream(cleanPath);
    const mime: Record<string, string> = { '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg' };
    return { stream, contentType: mime[ext] || 'image/jpeg' };
  }
}
