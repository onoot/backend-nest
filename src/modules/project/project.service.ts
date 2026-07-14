import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ProjectService {
  constructor(private db: DatabaseService) {}

  async getProjects(categoryId?: number) {
    let sql = 'SELECT * FROM project WHERE visible = 1';
    const params: any[] = [];
    if (categoryId) { sql += ' AND project_category_id = ?'; params.push(categoryId); }
    sql += ' ORDER BY sort ASC';
    return this.db.query(sql, params);
  }

  async getAllProjects(categoryId?: number, page?: number, limit = 20) {
    let where = '';
    const params: any[] = [];
    if (categoryId) { where = ' WHERE project_category_id = ?'; params.push(categoryId); }

    if (page) {
      const countResult = await this.db.getOne<{ total: number }>(`SELECT COUNT(*) as total FROM project${where}`, params);
      const total = countResult?.total ?? 0;
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      const items = await this.db.query(`SELECT * FROM project${where} ORDER BY sort ASC LIMIT ? OFFSET ?`, params);
      return { items, total, page, totalPages: Math.ceil(total / limit) };
    }

    return this.db.query(`SELECT * FROM project${where} ORDER BY sort ASC`, params);
  }

  async getProject(id: number) {
    const p = await this.db.getOne('SELECT * FROM project WHERE id = ?', [id]);
    if (!p) throw new NotFoundException('Project not found');
    return p;
  }

  private mapProjectData(data: any) {
    return DatabaseService.toDbKeys(data);
  }

  async createProject(data: any) {
    const max = await this.db.max('project', 'sort') ?? 0;
    const id = await this.db.insert('project', { ...this.mapProjectData(data), sort: data.sort ?? max + 1 });
    return this.getProject(id);
  }

  async updateProject(id: number, data: any) {
    await this.db.update('project', this.mapProjectData(data), { id });
    return this.getProject(id);
  }

  async deleteProject(id: number) { await this.db.delete('project', { id }); }
  async setVisible(id: number, visible: boolean) { await this.db.update('project', { visible }, { id }); }

  async getCategories() {
    return this.db.query('SELECT * FROM project_category ORDER BY sort ASC');
  }

  async getPublicCategories() {
    return this.db.query('SELECT * FROM project_category WHERE visible = 1 ORDER BY sort ASC');
  }

  async createCategory(data: any) {
    const max = await this.db.max('project_category', 'sort') ?? 0;
    const id = await this.db.insert('project_category', { ...DatabaseService.toDbKeys(data), sort: data.sort ?? max + 1 });
    return this.db.getOne('SELECT * FROM project_category WHERE id = ?', [id]);
  }

  async updateCategory(id: number, data: any) {
    await this.db.update('project_category', DatabaseService.toDbKeys(data), { id });
    return this.db.getOne('SELECT * FROM project_category WHERE id = ?', [id]);
  }

  async deleteCategory(id: number) {
    await this.db.execute('UPDATE project SET project_category_id = NULL WHERE project_category_id = ?', [id]);
    await this.db.delete('project_category', { id });
  }

  async sortCategories(ids: number[]) {
    for (let i = 0; i < ids.length; i++) {
      await this.db.update('project_category', { sort: i + 1 }, { id: ids[i] });
    }
  }
}
