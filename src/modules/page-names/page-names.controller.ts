import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PageNamesService } from './page-names.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class PageNamesController {
  constructor(private service: PageNamesService) {}

  @Public()
  @Get('page-names')
  async getAll() {
    return this.service.getAll();
  }

  @UseGuards(AuthGuard)
  @Post('page-names/save')
  async save(@Body() data: Record<string, string>) {
    await this.service.saveAll(data);
  }
}
