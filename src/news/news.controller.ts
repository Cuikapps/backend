import { Controller, Get } from '@nestjs/common';
import { ChangeLog } from './news';
import { NewsService } from './news.service';

@Controller('/news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get('/main')
  main(): ChangeLog[] {
    return this.news.getMain();
  }

  @Get('/website')
  website(): ChangeLog[] {
    return this.news.getWebsite();
  }

  @Get('/convertor')
  convertor(): ChangeLog[] {
    return this.news.getConvertor();
  }

  @Get('/apptray')
  apptray(): ChangeLog[] {
    return this.news.getApptray();
  }
}
