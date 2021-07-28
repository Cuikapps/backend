import { Test } from '@nestjs/testing';
import { NewsController } from './news.controller';

describe('NewsController', () => {
  let newsController: NewsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [], // Add
      controllers: [], // Add
      providers: [], // Add
    }).compile();

    newsController = moduleRef.get<NewsController>(NewsController);
  });

  it('should be defined', () => {
    expect(newsController).toBeDefined();
  });
});
