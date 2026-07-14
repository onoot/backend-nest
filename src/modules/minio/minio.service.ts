import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;

  onModuleInit() {
    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: parseInt(process.env.MINIO_PORT || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
    this.bucket = process.env.MINIO_BUCKET || 'pulsar-uploads';
  }

  async upload(filename: string, buffer: Buffer, contentType?: string) {
    await this.client.putObject(this.bucket, filename, buffer, undefined, {
      'Content-Type': contentType || 'application/octet-stream',
    });
  }

  async download(filename: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, filename);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async delete(filename: string) {
    await this.client.removeObject(this.bucket, filename);
  }

  async exists(filename: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucket, filename);
      return true;
    } catch {
      return false;
    }
  }

  async findFile(basename: string): Promise<string | null> {
    const stream = this.client.listObjects(this.bucket, '', true);
    return new Promise<string | null>((resolve, reject) => {
      stream.on('data', (obj) => {
        const name = obj.name;
        if (name === basename || name.endsWith('/' + basename)) {
          resolve(name);
        }
      });
      stream.on('end', () => resolve(null));
      stream.on('error', reject);
    });
  }

  async getStream(filename: string) {
    return this.client.getObject(this.bucket, filename);
  }

  async listFiles(prefix = ''): Promise<string[]> {
    const stream = this.client.listObjects(this.bucket, prefix, true);
    return new Promise<string[]>((resolve, reject) => {
      const files: string[] = [];
      stream.on('data', (obj) => {
        if (obj.name) files.push(obj.name);
      });
      stream.on('end', () => resolve(files));
      stream.on('error', reject);
    });
  }

  getBucket() {
    return this.bucket;
  }
}
