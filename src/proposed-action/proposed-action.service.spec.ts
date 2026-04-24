import { Test, TestingModule } from '@nestjs/testing';
import { ProposedActionRepository } from 'src/repository/proposed-action/proposed-action.repository';
import { ProposedActionService } from './proposed-action.service';

describe('ProposedActionService', () => {
  let service: ProposedActionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposedActionService,
        {
          provide: ProposedActionRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            list: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProposedActionService>(ProposedActionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
