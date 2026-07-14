import { Module } from '@nestjs/common';
import { PageNamesController } from './page-names.controller';
import { PageNamesService } from './page-names.service';

@Module({
  controllers: [PageNamesController],
  providers: [PageNamesService],
})
export class PageNamesModule {}
