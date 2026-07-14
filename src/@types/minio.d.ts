declare module 'minio' {
  export class Client {
    constructor(options: {
      endPoint: string;
      port: number;
      useSSL: boolean;
      accessKey: string;
      secretKey: string;
    });
    putObject(bucket: string, name: string, stream: Buffer, size?: number, metadata?: Record<string, string>): Promise<void>;
    getObject(bucket: string, name: string): Promise<NodeJS.ReadableStream>;
    removeObject(bucket: string, name: string): Promise<void>;
    statObject(bucket: string, name: string): Promise<any>;
    listObjects(bucket: string, prefix?: string, recursive?: boolean): NodeJS.ReadableStream;
  }
}
