import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class ProjectController {
  constructor(private service: ProjectService) {}

  @Public()
  @Get('projects')
  async getProjects(@Query('categoryId') categoryId?: string) {
    return this.service.getProjects(categoryId ? Number(categoryId) : undefined);
  }

  @Public()
  @Get('project-categories')
  async getCategories() {
    return this.service.getPublicCategories();
  }

  @UseGuards(AuthGuard)
  @Post('project/list')
  async list(@Body() body: { categoryId?: number; page?: number; limit?: number }) {
    return this.service.getAllProjects(body.categoryId, body.page, body.limit);
  }

  @UseGuards(AuthGuard)
  @Post('project/create')
  async create(@Body() data: any) {
    return this.service.createProject(data);
  }

  @UseGuards(AuthGuard)
  @Post('project/save')
  async save(@Body() data: any) {
    return this.service.updateProject(data.id, data);
  }

  @UseGuards(AuthGuard)
  @Post('project/delete')
  async delete(@Body('id') id: number) {
    await this.service.deleteProject(id);
  }

  @UseGuards(AuthGuard)
  @Post('project/visible')
  async visible(@Body('id') id: number, @Body('visible') visible: boolean) {
    await this.service.setVisible(id, visible);
  }

  @UseGuards(AuthGuard)
  @Post('project-category/list')
  async listCategories() {
    return this.service.getCategories();
  }

  @UseGuards(AuthGuard)
  @Post('project-category/create')
  async createCategory(@Body() data: any) {
    return this.service.createCategory(data);
  }

  @UseGuards(AuthGuard)
  @Post('project-category/save')
  async saveCategory(@Body() data: any) {
    return this.service.updateCategory(data.id, data);
  }

  @UseGuards(AuthGuard)
  @Post('project-category/delete')
  async deleteCategory(@Body('id') id: number) {
    await this.service.deleteCategory(id);
  }

  @UseGuards(AuthGuard)
  @Post('project-categories/sort')
  async sortCategories(@Body('ids') ids: number[]) {
    await this.service.sortCategories(ids);
  }
}
