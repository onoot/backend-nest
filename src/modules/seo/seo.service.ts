import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class SeoService {
  constructor(private db: DatabaseService) {}

  async findByPage(page: string) {
    return this.db.getOne('SELECT * FROM seo WHERE page = ?', [page]);
  }

  async findAll(page?: number, limit = 20) {
    if (page) {
      const countResult = await this.db.getOne<{ total: number }>('SELECT COUNT(*) as total FROM seo');
      const total = countResult?.total ?? 0;
      const offset = (page - 1) * limit;
      const items = await this.db.query('SELECT * FROM seo LIMIT ? OFFSET ?', [limit, offset]);
      return { items, total, page, totalPages: Math.ceil(total / limit) };
    }
    return this.db.query('SELECT * FROM seo');
  }

  async save(seo: { page: string; title: string; description?: string; keywords?: string }) {
    await this.db.execute(
      'INSERT INTO seo (page, title, description, keywords) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), description = VALUES(description), keywords = VALUES(keywords)',
      [seo.page, seo.title, seo.description ?? null, seo.keywords ?? null],
    );
    return this.findByPage(seo.page);
  }
}
