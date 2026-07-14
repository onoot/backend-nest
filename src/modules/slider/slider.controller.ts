import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SliderService } from './slider.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class SliderController {
  constructor(private service: SliderService) {}

  @Public()
  @Get('slides')
  async getSlides() { return this.service.findAll(true); }

  @UseGuards(AuthGuard)
  @Post('slide/list') async list(@Body('page') page?: number, @Body('limit') limit?: number) { return this.service.findAll(false, page, limit); }

  @UseGuards(AuthGuard)
  @Post('slide/create') async create(@Body() data: any) { return this.service.create(data); }

  @UseGuards(AuthGuard)
  @Post('slide/save') async save(@Body() data: any) { return this.service.update(data.id, data); }

  @UseGuards(AuthGuard)
  @Post('slide/delete') async delete(@Body('id') id: number) { await this.service.remove(id); }

  @UseGuards(AuthGuard)
  @Post('slide/visible') async visible(@Body('id') id: number, @Body('visible') visible: boolean) {
    await this.service.setVisible(id, visible);
  }

  @UseGuards(AuthGuard)
  @Post('slides/sort') async sort(@Body('ids') ids: number[]) { await this.service.sort(ids); }
}
