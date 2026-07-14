import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class PageNamesService {
  constructor(private db: DatabaseService) {}

  async getAll(): Promise<Record<string, string>> {
    const rows = await this.db.query<{ id: string; value: string }>(
      "SELECT id, value FROM company_info WHERE id LIKE 'page_name_%'",
    );
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.id.replace('page_name_', '')] = row.value;
    }
    return result;
  }

  async saveAll(data: Record<string, string>) {
    for (const [id, value] of Object.entries(data)) {
      await this.db.execute(
        'INSERT INTO company_info (id, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
        [`page_name_${id}`, value],
      );
    }
  }
}
