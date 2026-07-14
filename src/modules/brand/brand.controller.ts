import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { BrandService } from './brand.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class BrandController {
  constructor(private service: BrandService) {}

  @Public()
  @Get('brands')
  async getBrands() {
    return this.service.findAll(true);
  }

  @UseGuards(AuthGuard)
  @Post('brand/list')
  async list(@Body('page') page?: number, @Body('limit') limit?: number) {
    return this.service.findAll(false, page, limit);
  }

  @UseGuards(AuthGuard)
  @Post('brand/create')
  async create(@Body() data: any) {
    return this.service.create(data);
  }

  @UseGuards(AuthGuard)
  @Post('brand/save')
  async save(@Body() data: any) {
    return this.service.update(data.id, data);
  }

  @UseGuards(AuthGuard)
  @Post('brand/delete')
  async delete(@Body('id') id: number) {
    await this.service.remove(id);
  }

  @UseGuards(AuthGuard)
  @Post('brand/visible')
  async visible(@Body('id') id: number, @Body('visible') visible: boolean) {
    await this.service.setVisible(id, visible);
  }

  @UseGuards(AuthGuard)
  @Post('brands/sort')
  async sort(@Body('ids') ids: number[]) {
    await this.service.sort(ids);
  }
}
