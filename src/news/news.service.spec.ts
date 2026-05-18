import { Test, TestingModule } from '@nestjs/testing';
import { CommentRepository } from 'src/repository/comment/comment.repository';
import { KeywordRepository } from 'src/repository/keyword/keyword.repository';
import { NewsRepository } from 'src/repository/news/news.repository';
import { NewsService } from './news.service';

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: NewsRepository,
          useValue: {},
        },
        {
          provide: KeywordRepository,
          useValue: {},
        },
        {
          provide: CommentRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
