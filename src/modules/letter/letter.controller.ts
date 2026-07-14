import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { LetterService } from './letter.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class LetterController {
  constructor(private service: LetterService) {}

  @Public()
  @Get('letters')
  async getLetters() { return this.service.findAll(true); }

  @UseGuards(AuthGuard)
  @Post('letter/list') async list(@Body('page') page?: number, @Body('limit') limit?: number) { return this.service.findAll(false, page, limit); }

  @UseGuards(AuthGuard)
  @Post('letter/create') async create(@Body() data: any) { return this.service.create(data); }

  @UseGuards(AuthGuard)
  @Post('letter/save') async save(@Body() data: any) { return this.service.update(data.id, data); }

  @UseGuards(AuthGuard)
  @Post('letter/delete') async delete(@Body('id') id: number) { await this.service.remove(id); }

  @UseGuards(AuthGuard)
  @Post('letter/visible') async visible(@Body('id') id: number, @Body('visible') visible: boolean) {
    await this.service.setVisible(id, visible);
  }

  @UseGuards(AuthGuard)
  @Post('letters/sort') async sort(@Body('ids') ids: number[]) { await this.service.sort(ids); }
}
