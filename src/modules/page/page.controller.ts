import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PageService } from './page.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class PageController {
  constructor(private service: PageService) {}

  @Public()
  @Get('page/:page')
  async getPage(@Param('page') page: string) {
    return this.service.getPage(page as 'about' | 'delivery');
  }

  @UseGuards(AuthGuard)
  @Post('page/save')
  async savePage(@Body('page') page: string, @Body('data') data: Record<string, string>) {
    await this.service.updatePage(page as 'about' | 'delivery', data);
  }
}
