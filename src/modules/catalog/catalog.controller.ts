import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class CatalogController {
  constructor(private service: CatalogService) {}

  @Public()
  @Get('catalog/categories')
  async getCategories() {
    return this.service.getCategories();
  }

  @Public()
  @Get('catalog/category-tree')
  async getCategoryTree() {
    return this.service.getCategoryTree();
  }

  @Public()
  @Get('catalog/products')
  async getProducts(
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getProducts(
      categoryId ? Number(categoryId) : undefined,
      Number(page) || 1,
      12,
      search,
    );
  }

  @Public()
  @Get('catalog/product/:id')
  async getProduct(@Param('id') id: string) {
    return this.service.getProduct(Number(id));
  }

  @UseGuards(AuthGuard)
  @Post('product-category/list')
  async listCategories(@Body('page') page?: number, @Body('limit') limit?: number) {
    return this.service.getAllCategories(page, limit);
  }

  @UseGuards(AuthGuard)
  @Post('product-category/create')
  async createCategory(@Body() data: any) {
    return this.service.createCategory(data);
  }

  @UseGuards(AuthGuard)
  @Post('product-category/save')
  async saveCategory(@Body() data: any) {
    return this.service.updateCategory(data.id, data);
  }

  @UseGuards(AuthGuard)
  @Post('product-category/delete')
  async deleteCategory(@Body('id') id: number) {
    await this.service.deleteCategory(id);
  }

  @UseGuards(AuthGuard)
  @Post('product-category/visible')
  async categoryVisible(@Body('id') id: number, @Body('visible') visible: boolean) {
    await this.service.setCategoryVisible(id, visible);
  }

  @UseGuards(AuthGuard)
  @Post('product-categories/sort')
  async sortCategories(@Body('ids') ids: number[]) {
    await this.service.sortCategories(ids);
  }

  @UseGuards(AuthGuard)
  @Post('product/list')
  async listProducts(@Body() body: { categoryId?: number; page?: number; limit?: number }) {
    return this.service.getAllProducts(body.categoryId, body.page, body.limit);
  }

  @UseGuards(AuthGuard)
  @Post('product/create')
  async createProduct(@Body() data: any) {
    return this.service.createProduct(data);
  }

  @UseGuards(AuthGuard)
  @Post('product/save')
  async saveProduct(@Body() data: any) {
    return this.service.updateProduct(data.id, data);
  }

  @UseGuards(AuthGuard)
  @Post('product/delete')
  async deleteProduct(@Body('id') id: number) {
    await this.service.deleteProduct(id);
  }

  @UseGuards(AuthGuard)
  @Post('product/visible')
  async productVisible(@Body('id') id: number, @Body('visible') visible: boolean) {
    await this.service.setProductVisible(id, visible);
  }

  @UseGuards(AuthGuard)
  @Post('product/photo/add')
  async addPhoto(@Body('productId') productId: number, @Body('name') name: string) {
    return this.service.addPhoto(productId, name);
  }

  @UseGuards(AuthGuard)
  @Post('product/photo/delete')
  async deletePhoto(@Body('id') id: number) {
    await this.service.deletePhoto(id);
  }

  @UseGuards(AuthGuard)
  @Post('product/photos/sort')
  async sortPhotos(@Body('ids') ids: number[]) {
    await this.service.sortPhotos(ids);
  }
}
