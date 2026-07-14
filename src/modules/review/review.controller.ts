import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReviewService } from './review.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class ReviewController {
  constructor(private service: ReviewService) {}

  @Public()
  @Get('reviews')
  async getReviews() { return this.service.findAll(true); }

  @UseGuards(AuthGuard)
  @Post('review/list') async list(@Body('page') page?: number, @Body('limit') limit?: number) { return this.service.findAll(false, page, limit); }

  @UseGuards(AuthGuard)
  @Post('review/create') async create(@Body() data: any) { return this.service.create(data); }

  @UseGuards(AuthGuard)
  @Post('review/save') async save(@Body() data: any) { return this.service.update(data.id, data); }

  @UseGuards(AuthGuard)
  @Post('review/delete') async delete(@Body('id') id: number) { await this.service.remove(id); }

  @UseGuards(AuthGuard)
  @Post('review/visible') async visible(@Body('id') id: number, @Body('visible') visible: boolean) {
    await this.service.setVisible(id, visible);
  }

  @UseGuards(AuthGuard)
  @Post('reviews/sort') async sort(@Body('ids') ids: number[]) { await this.service.sort(ids); }
}
