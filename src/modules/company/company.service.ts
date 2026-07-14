import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class CompanyService {
  constructor(private db: DatabaseService) {}

  async getInfo() {
    const items = await this.db.query<{ id: string; value: string }>('SELECT id, value FROM company_info');
    const result: Record<string, string> = {};
    for (const item of items) {
      result[item.id] = item.value;
    }
    return result;
  }

  async updateInfo(data: Record<string, string>) {
    for (const [id, value] of Object.entries(data)) {
      await this.db.execute(
        'INSERT INTO company_info (id, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
        [id, value],
      );
    }
  }

  async getStatistics() {
    return this.db.query('SELECT * FROM statistic WHERE visible = 1 ORDER BY sort ASC');
  }

  async saveStatistics(items: any[]) {
    for (const item of items) {
      await this.db.execute(
        `INSERT INTO statistic (id, value, label, sort, visible) VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE value = VALUES(value), label = VALUES(label), sort = VALUES(sort), visible = VALUES(visible)`,
        [item.id, item.value, item.label, item.sort ?? 0, item.visible ?? true],
      );
    }
  }
}
