import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SeoService } from './seo.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class SeoController {
  constructor(private service: SeoService) {}

  @Public()
  @Get('seo/:page')
  async getSeo(@Param('page') page: string) { return this.service.findByPage(page); }

  @UseGuards(AuthGuard)
  @Post('seo/list') async list(@Body('page') page?: number, @Body('limit') limit?: number) { return this.service.findAll(page, limit); }

  @UseGuards(AuthGuard)
  @Post('seo/save') async save(@Body() data: { page: string; title: string; description?: string; keywords?: string }) {
    return this.service.save(data);
  }
}
