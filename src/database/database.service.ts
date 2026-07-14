import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as mysql from 'mysql2/promise';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'mysql',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'pulsar',
      password: process.env.DB_PASSWORD || 'pulsar',
      database: process.env.DB_NAME || 'pulsar',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const [rows] = await this.pool.query(sql, params);
    return rows as T[];
  }

  async execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId?: number }> {
    const [result] = await this.pool.execute(sql, params);
    return result as any;
  }

  async getOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  async insert(table: string, data: Record<string, any>): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO \`${table}\` (${keys.map(k => `\`${k}\``).join(', ')}) VALUES (${placeholders})`;
    const result = await this.execute(sql, values);
    return result.insertId ?? 0;
  }

  async update(table: string, data: Record<string, any>, where: Record<string, any>): Promise<void> {
    const whereKeys = new Set(Object.keys(where));
    const filtered: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (!whereKeys.has(k)) filtered[k] = v;
    }
    const setKeys = Object.keys(filtered);
    if (setKeys.length === 0) return;
    const setClauses = setKeys.map(k => `\`${k}\` = ?`).join(', ');
    const whereClauses = Object.keys(where).map(k => `\`${k}\` = ?`).join(' AND ');
    const values = [...Object.values(filtered), ...Object.values(where)];
    await this.execute(`UPDATE \`${table}\` SET ${setClauses} WHERE ${whereClauses}`, values);
  }

  static toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  static toDbKeys(obj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[DatabaseService.toSnakeCase(k)] = v;
    }
    return result;
  }

  async delete(table: string, where: Record<string, any>): Promise<void> {
    const keys = Object.keys(where);
    const clauses = keys.map(k => `\`${k}\` = ?`).join(' AND ');
    await this.execute(`DELETE FROM \`${table}\` WHERE ${clauses}`, Object.values(where));
  }

  async max(table: string, column: string, where?: Record<string, any>): Promise<number | null> {
    let sql = `SELECT MAX(\`${column}\`) as m FROM \`${table}\``;
    const params: any[] = [];
    if (where) {
      const keys = Object.keys(where);
      sql += ` WHERE ${keys.map(k => `\`${k}\` = ?`).join(' AND ')}`;
      params.push(...Object.values(where));
    }
    const row = await this.getOne<{ m: number | null }>(sql, params);
    return row?.m ?? null;
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
