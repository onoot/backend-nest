import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class CompanyController {
  constructor(private service: CompanyService) {}

  @Public()
  @Get('company/info')
  async getInfo() {
    return this.service.getInfo();
  }

  @Public()
  @Get('statistics')
  async getStatistics() {
    return this.service.getStatistics();
  }

  @UseGuards(AuthGuard)
  @Post('company/info/save')
  async saveInfo(@Body() data: Record<string, string>) {
    await this.service.updateInfo(data);
  }

  @UseGuards(AuthGuard)
  @Post('statistics/save')
  async saveStatistics(@Body('items') items: any[]) {
    await this.service.saveStatistics(items);
  }
}
