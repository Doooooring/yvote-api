import { Test, TestingModule } from '@nestjs/testing';
import { AdminGuard } from 'src/auth/admin/admin.guard';
import { ProposedActionController } from './proposed-action.controller';
import { ProposedActionService } from './proposed-action.service';

describe('ProposedActionController', () => {
  let controller: ProposedActionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposedActionController],
      providers: [
        {
          provide: ProposedActionService,
          useValue: {
            create: jest.fn(),
            list: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            approve: jest.fn(),
            reject: jest.fn(),
            markApplied: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProposedActionController>(ProposedActionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
