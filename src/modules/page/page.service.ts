import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class PageService {
  constructor(private db: DatabaseService) {}

  async getPage(page: 'about' | 'delivery') {
    const items = await this.db.query<{ id: string; value: string }>(
      'SELECT id, value FROM page_content WHERE page = ?',
      [page],
    );
    const result: Record<string, string> = {};
    for (const item of items) {
      result[item.id] = item.value;
    }
    return result;
  }

  async updatePage(page: 'about' | 'delivery', data: Record<string, string>) {
    for (const [id, value] of Object.entries(data)) {
      await this.db.execute(
        'INSERT INTO page_content (id, page, value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value), page = VALUES(page)',
        [id, page, value],
      );
    }
  }
}
