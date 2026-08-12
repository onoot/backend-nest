import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class CatalogService {
  constructor(private db: DatabaseService) {}

  private async attachCategoryParentPhotos(categories: any[]): Promise<any[]> {
    if (categories.length === 0) return categories;
    const all = await this.db.query('SELECT id, photo, parent_id FROM product_category');
    const catMap = new Map<number, any>();
    for (const c of all) catMap.set(c.id, c);

    return categories.map((cat: any) => {
      let parentPhoto: string | null = null;
      let current = catMap.get(cat.parent_id);
      while (current) {
        if (current.photo) { parentPhoto = current.photo; break; }
        if (!current.parent_id || current.parent_id === 0) break;
        current = catMap.get(current.parent_id);
      }
      return { ...cat, parent_photo: parentPhoto };
    });
  }

  private async hasUncategorizedVisible(): Promise<boolean> {
    const row = await this.db.getOne<{ c: number }>('SELECT COUNT(*) as c FROM product WHERE category_id IS NULL AND visible = 1');
    return (row?.c ?? 0) > 0;
  }

  private virtualMiscCategory(): any {
    return { id: 0, name: 'Прочее', photo: null, parent_id: 0, sort: 999999, visible: 1, properties: null, children: [] };
  }

  async getCategories(parentId?: number) {
    let sql = 'SELECT * FROM product_category WHERE visible = 1';
    const params: any[] = [];
    if (parentId !== undefined) {
      sql += ' AND parent_id = ?';
      params.push(parentId);
    }
    sql += ' ORDER BY sort ASC';
    const cats = await this.attachCategoryParentPhotos(await this.db.query(sql, params));
    if (parentId === undefined && await this.hasUncategorizedVisible()) {
      cats.push({ ...this.virtualMiscCategory(), parent_photo: null });
    }
    return cats;
  }

  async getAllCategories(page?: number, limit = 20) {
    if (page) {
      const countResult = await this.db.getOne<{ total: number }>('SELECT COUNT(*) as total FROM product_category');
      const total = countResult?.total ?? 0;
      const offset = (page - 1) * limit;
      const items = await this.db.query('SELECT * FROM product_category ORDER BY sort ASC LIMIT ? OFFSET ?', [limit, offset]);
      return { items: this.parseCategoryProps(await this.attachCategoryParentPhotos(items)), total, page, totalPages: Math.ceil(total / limit) };
    }
    return this.parseCategoryProps(await this.attachCategoryParentPhotos(await this.db.query('SELECT * FROM product_category ORDER BY sort ASC')));
  }

  private parseCategoryProps(cats: any[]): any[] {
    for (const c of cats) {
      if (c.properties && typeof c.properties === 'string') {
        try { c.properties = JSON.parse(c.properties); } catch { c.properties = null; }
      }
    }
    return cats;
  }

  async getCategoryTree(): Promise<any[]> {
    const all = await this.db.query('SELECT * FROM product_category ORDER BY sort ASC');
    for (const c of all) {
      if (c.properties && typeof c.properties === 'string') {
        try { c.properties = JSON.parse(c.properties); } catch { c.properties = null; }
      }
    }
    const tree = this.buildTree(all);
    if (await this.hasUncategorizedVisible()) {
      tree.push(this.virtualMiscCategory());
    }
    return tree;
  }

  private buildTree(items: any[], parentId: number | null = null): any[] {
    return items
      .filter((c: any) => {
        if (parentId === null) {
          return !c.parent_id || c.parent_id === 0;
        }
        return c.parent_id === parentId;
      })
      .map((c: any) => ({
        ...c,
        children: this.buildTree(items, c.id),
      }));
  }

  private mapCategoryData(data: any) {
    return DatabaseService.toDbKeys(data);
  }

  async createCategory(data: any) {
    const max = await this.db.max('product_category', 'sort') ?? 0;
    const mapped = this.mapCategoryData(data);
    if (data.properties !== undefined) mapped.properties = JSON.stringify(data.properties);
    const id = await this.db.insert('product_category', { ...mapped, sort: data.sort ?? max + 1 });
    return this.db.getOne('SELECT * FROM product_category WHERE id = ?', [id]);
  }

  async updateCategory(id: number, data: any) {
    const mapped = this.mapCategoryData(data);
    if (data.properties !== undefined) mapped.properties = JSON.stringify(data.properties);
    await this.db.update('product_category', mapped, { id });
    return this.db.getOne('SELECT * FROM product_category WHERE id = ?', [id]);
  }

  async deleteCategory(id: number) {
    await this.db.execute('UPDATE product SET category_id = NULL WHERE category_id = ?', [id]);
    await this.db.delete('product_category', { id });
  }

  async setCategoryVisible(id: number, visible: boolean) {
    await this.db.update('product_category', { visible }, { id });
  }

  async sortCategories(ids: number[]) {
    for (let i = 0; i < ids.length; i++) {
      await this.db.update('product_category', { sort: i + 1 }, { id: ids[i] });
    }
  }

  private async resolveCategoryPhoto(categoryId: number): Promise<string | null> {
    const all = await this.db.query('SELECT id, photo, parent_id FROM product_category');
    const catMap = new Map<number, any>();
    for (const c of all) catMap.set(c.id, c);

    let current = catMap.get(categoryId);
    while (current) {
      if (current.photo) return current.photo;
      if (!current.parent_id || current.parent_id === 0) break;
      current = catMap.get(current.parent_id);
    }
    return null;
  }

  private async resolveCategoryProperties(categoryId: number): Promise<any[] | null> {
    const all = await this.db.query('SELECT id, properties, parent_id FROM product_category');
    const catMap = new Map<number, any>();
    for (const c of all) catMap.set(c.id, c);

    let current = catMap.get(categoryId);
    while (current) {
      if (current.properties) {
        try {
          const props = typeof current.properties === 'string' ? JSON.parse(current.properties) : current.properties;
          if (Array.isArray(props) && props.length > 0) return props;
        } catch {}
      }
      if (!current.parent_id || current.parent_id === 0) break;
      current = catMap.get(current.parent_id);
    }
    return null;
  }

  private resolveNearestCategoryName(catMap: Map<number, any>, categoryId: number | null): string | null {
    if (!categoryId) return null;
    let current = catMap.get(categoryId);
    while (current) {
      if (current.name && current.name.trim().length > 0) return current.name;
      if (!current.parent_id || current.parent_id === 0) break;
      current = catMap.get(current.parent_id);
    }
    return null;
  }

  private attachCategoryPhotos(products: any[]): Promise<any[]> {
    if (products.length === 0) return Promise.resolve(products);
    return this.db.query('SELECT id, photo, parent_id, name FROM product_category').then((all) => {
      const catMap = new Map<number, any>();
      for (const c of all) catMap.set(c.id, c);

      const ids = products.map((p: any) => p.id);
      return this.db.query(
        `SELECT product_id, name FROM product_photo WHERE product_id IN (${ids.map(() => '?').join(',')}) ORDER BY sort ASC`,
        ids,
      ).then((photos) => {
        const photoMap = new Map<number, string>();
        for (const ph of photos) {
          if (!photoMap.has(ph.product_id)) photoMap.set(ph.product_id, ph.name);
        }

        return products.map((p: any) => {
          const ownPhoto = photoMap.get(p.id) || p.photo || null;
          let categoryPhoto: string | null = null;
          if (p.category_id) {
            let current = catMap.get(p.category_id);
            while (current) {
              if (current.photo) { categoryPhoto = current.photo; break; }
              if (!current.parent_id || current.parent_id === 0) break;
              current = catMap.get(current.parent_id);
            }
          }
          const hasOwnName = p.name && p.name.trim().length > 0;
          const displayName = hasOwnName ? p.name : this.resolveNearestCategoryName(catMap, p.category_id);
          return { ...p, ownPhoto, categoryPhoto, displayName };
        });
      });
    });
  }

  async getProducts(categoryId?: number, page = 1, limit = 12, search?: string) {
    let innerWhere = 'WHERE p2.visible = 1';
    const innerParams: any[] = [];
    if (categoryId !== undefined) {
      if (categoryId === 0) {
        innerWhere += ' AND p2.category_id IS NULL';
      } else {
        const ids = await this.getChildCategoryIds(categoryId);
        if (ids.length === 1) {
          innerWhere += ' AND p2.category_id = ?';
          innerParams.push(categoryId);
        } else {
          innerWhere += ` AND p2.category_id IN (${ids.map(() => '?').join(',')})`;
          innerParams.push(...ids);
        }
      }
    }
    if (search) {
      innerWhere += ' AND (p2.sku LIKE ? OR p2.name LIKE ? OR pc2.name LIKE ? OR p2.properties LIKE ?)';
      innerParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const dedupSub = `(SELECT MIN(p2.id) as id FROM product p2 LEFT JOIN product_category pc2 ON p2.category_id = pc2.id ${innerWhere} GROUP BY COALESCE(p2.category_id, p2.id))`;

    const countResult = await this.db.getOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM ${dedupSub} as dedup`, innerParams,
    );
    const total = countResult?.total ?? 0;

    const offset = (page - 1) * limit;
    const items = await this.db.query(
      `SELECT p.*, pc.name as categoryName FROM product p LEFT JOIN product_category pc ON p.category_id = pc.id WHERE p.id IN ${dedupSub} ORDER BY p.sort ASC LIMIT ? OFFSET ?`,
      [...innerParams, limit, offset],
    );

    const withPhotos = await this.attachCategoryPhotos(items);
    for (const p of withPhotos) {
      if (p.properties && typeof p.properties === 'string') {
        try { p.properties = JSON.parse(p.properties); } catch { p.properties = null; }
      }
      const ownPhotos = await this.db.query('SELECT name FROM product_photo WHERE product_id = ? ORDER BY sort ASC', [p.id]);
      p.ownPhotos = ownPhotos.map((ph: any) => ph.name);
      p.mainPhoto = ownPhotos.length > 0 ? ownPhotos[0].name : p.categoryPhoto;
    }

    return { items: withPhotos, total, page, totalPages: Math.ceil(total / limit) };
  }

  private async getChildCategoryIds(parentId: number): Promise<number[]> {
    const all = await this.db.query('SELECT id, parent_id FROM product_category');
    const ids: number[] = [parentId];
    const queue = [parentId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      for (const c of all) {
        if (c.parent_id === current && !ids.includes(c.id)) {
          ids.push(c.id);
          queue.push(c.id);
        }
      }
    }
    return ids;
  }

  async getAllProducts(categoryId?: number, page?: number, limit = 20) {
    let where = '';
    const params: any[] = [];
    if (categoryId !== undefined) {
      where = categoryId === 0 ? 'WHERE p.category_id IS NULL' : 'WHERE p.category_id = ?';
      if (categoryId !== 0) params.push(categoryId);
    }

    if (page) {
      const countResult = await this.db.getOne<{ total: number }>(
        `SELECT COUNT(*) as total FROM product p ${where}`, params,
      );
      const total = countResult?.total ?? 0;
      const offset = (page - 1) * limit;
      params.push(limit, offset);
      const items = await this.db.query(
        `SELECT p.*, pc.name as categoryName FROM product p LEFT JOIN product_category pc ON p.category_id = pc.id ${where} ORDER BY p.sort ASC LIMIT ? OFFSET ?`, params,
      );
      return { items: await this.attachCategoryPhotos(items), total, page, totalPages: Math.ceil(total / limit) };
    }

    let items: any[];
    if (categoryId !== undefined) {
      if (categoryId === 0) {
        items = await this.db.query('SELECT p.*, pc.name as categoryName FROM product p LEFT JOIN product_category pc ON p.category_id = pc.id WHERE p.category_id IS NULL ORDER BY p.sort ASC');
      } else {
        items = await this.db.query('SELECT p.*, pc.name as categoryName FROM product p LEFT JOIN product_category pc ON p.category_id = pc.id WHERE p.category_id = ? ORDER BY p.sort ASC', [categoryId]);
      }
    } else {
      items = await this.db.query('SELECT p.*, pc.name as categoryName FROM product p LEFT JOIN product_category pc ON p.category_id = pc.id ORDER BY p.sort ASC');
    }
    return this.attachCategoryPhotos(items);
  }

  async getProduct(id: number) {
    const product = await this.db.getOne('SELECT p.*, pc.name as categoryName FROM product p LEFT JOIN product_category pc ON p.category_id = pc.id WHERE p.id = ?', [id]);
    if (!product) throw new NotFoundException('Product not found');
    const photos = await this.db.query('SELECT * FROM product_photo WHERE product_id = ? ORDER BY sort ASC', [id]);
    if (!product.photo && photos.length > 0) product.photo = photos[0].name;
    const documents = await this.db.query('SELECT * FROM document WHERE product_id = ? AND visible = 1 ORDER BY sort ASC', [id]);
    const categoryPhoto = product.category_id ? await this.resolveCategoryPhoto(product.category_id) : null;
    const displayName = product.name && product.name.trim().length > 0
      ? product.name
      : await this.resolveProductDisplayName(product.category_id);

    let productProps: Record<string, string> | null = null;
    if (product.properties) {
      try { productProps = typeof product.properties === 'string' ? JSON.parse(product.properties) : product.properties; } catch { productProps = null; }
    }

    let excludedProps: string[] = [];
    if (product.excluded_properties) {
      try { excludedProps = typeof product.excluded_properties === 'string' ? JSON.parse(product.excluded_properties) : product.excluded_properties; } catch {}
    }

    let categoryProps: any[] | null = null;
    if (product.category_id) {
      const catProps = await this.resolveCategoryProperties(product.category_id);
      if (catProps && catProps.length > 0) {
        categoryProps = catProps;
        if (!productProps) productProps = {};
      }
    }

    return { ...product, categoryPhoto, displayName, photos, documents, properties: productProps, categoryProperties: categoryProps, excludedProperties: excludedProps };
  }

  private async resolveProductDisplayName(categoryId: number | null): Promise<string | null> {
    if (!categoryId) return null;
    const all = await this.db.query('SELECT id, name, parent_id FROM product_category');
    const catMap = new Map<number, any>();
    for (const c of all) catMap.set(c.id, c);
    return this.resolveNearestCategoryName(catMap, categoryId);
  }

  private mapProductData(data: any) {
    return DatabaseService.toDbKeys(data);
  }

  async createProduct(data: any) {
    const max = await this.db.max('product', 'sort') ?? 0;
    const mapped = this.mapProductData(data);
    if (data.properties !== undefined) mapped.properties = JSON.stringify(data.properties);
    if (data.excludedProperties !== undefined) mapped.excluded_properties = JSON.stringify(data.excludedProperties);
    const id = await this.db.insert('product', { ...mapped, sort: data.sort ?? max + 1 });
    return this.getProduct(id);
  }

  async updateProduct(id: number, data: any) {
    const mapped = this.mapProductData(data);
    if (data.properties !== undefined) mapped.properties = JSON.stringify(data.properties);
    if (data.excludedProperties !== undefined) mapped.excluded_properties = JSON.stringify(data.excludedProperties);
    await this.db.update('product', mapped, { id });
    return this.getProduct(id);
  }

  async deleteProduct(id: number) {
    await this.db.delete('product_photo', { product_id: id });
    await this.db.delete('document', { product_id: id });
    await this.db.delete('product', { id });
  }

  async setProductVisible(id: number, visible: boolean) {
    await this.db.update('product', { visible }, { id });
  }

  async addPhoto(productId: number, name: string) {
    const max = await this.db.max('product_photo', 'sort', { product_id: productId }) ?? 0;
    const id = await this.db.insert('product_photo', { product_id: productId, name, sort: max + 1 });
    return this.db.getOne('SELECT * FROM product_photo WHERE id = ?', [id]);
  }

  async deletePhoto(id: number) {
    await this.db.delete('product_photo', { id });
  }

  async sortPhotos(ids: number[]) {
    for (let i = 0; i < ids.length; i++) {
      await this.db.update('product_photo', { sort: i + 1 }, { id: ids[i] });
    }
  }
}
