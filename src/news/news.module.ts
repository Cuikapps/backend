import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [NewsController],
  providers: [NewsService],
})
export class NewsModule {}
