import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ReviewService {
  constructor(private db: DatabaseService) {}

  async findAll(visibleOnly = false, page?: number, limit = 20) {
    const where = visibleOnly ? ' WHERE visible = 1' : '';

    if (page) {
      const countResult = await this.db.getOne<{ total: number }>(`SELECT COUNT(*) as total FROM review${where}`);
      const total = countResult?.total ?? 0;
      const offset = (page - 1) * limit;
      const items = await this.db.query(`SELECT * FROM review${where} ORDER BY sort ASC LIMIT ? OFFSET ?`, [limit, offset]);
      return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    return this.db.query(`SELECT * FROM review${where} ORDER BY sort ASC`);
  }

  async findOne(id: number) {
    const item = await this.db.getOne('SELECT * FROM review WHERE id = ?', [id]);
    if (!item) throw new NotFoundException('Review not found');
    return item;
  }

  async create(data: any) {
    const max = await this.db.max('review', 'sort') ?? 0;
    const id = await this.db.insert('review', { ...DatabaseService.toDbKeys(data), sort: data.sort ?? max + 1 });
    return this.findOne(id);
  }

  async update(id: number, data: any) {
    await this.db.update('review', DatabaseService.toDbKeys(data), { id });
    return this.findOne(id);
  }

  async remove(id: number) { await this.db.delete('review', { id }); }
  async setVisible(id: number, visible: boolean) { await this.db.update('review', { visible }, { id }); }

  async sort(ids: number[]) {
    for (let i = 0; i < ids.length; i++) await this.db.update('review', { sort: i + 1 }, { id: ids[i] });
  }
}
