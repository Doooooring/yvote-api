import { Test, TestingModule } from '@nestjs/testing';
import { KeywordRepository } from 'src/repository/keyword/keyword.repository';
import { NewsRepository } from 'src/repository/news/news.repository';
import { KeywordService } from './keyword.service';

describe('KeywordService', () => {
  let service: KeywordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeywordService,
        {
          provide: KeywordRepository,
          useValue: {},
        },
        {
          provide: NewsRepository,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<KeywordService>(KeywordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
