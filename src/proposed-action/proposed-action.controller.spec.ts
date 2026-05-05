import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ProposedActionController } from './proposed-action.controller';
import { ProposedActionService } from './proposed-action.service';

describe('ProposedActionController', () => {
  let controller: ProposedActionController;
  let service: { createBatch: jest.Mock };

  beforeEach(async () => {
    service = {
      createBatch: jest.fn(async (body) => body.actions),
    };
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProposedActionController],
      providers: [
        {
          provide: ProposedActionService,
          useValue: {
            ...service,
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
    }).compile();

    controller = module.get<ProposedActionController>(ProposedActionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const methodGuards = (methodName: keyof ProposedActionController) =>
    Reflect.getMetadata(
      GUARDS_METADATA,
      Object.getOwnPropertyDescriptor(
        ProposedActionController.prototype,
        methodName,
      )?.value,
    ) || [];

  it('does not apply the old AdminGuard to /adminjae2 proposed-action endpoints', () => {
    for (const methodName of [
      'create',
      'createBatch',
      'list',
      'getById',
      'approve',
      'reject',
      'markApplied',
      'update',
      'delete',
    ] as const) {
      expect(methodGuards(methodName)).toEqual([]);
    }
  });

  it('forwards batch create body to the service', async () => {
    const body = {
      actions: [
        {
          actionType: 'create_news',
          payload: { title: 'Daily bill', newsType: 'plenary' },
          source: 'claude_triage',
        },
      ],
    };

    await controller.createBatch(body as never);

    expect(service.createBatch).toHaveBeenCalledTimes(1);
    expect(service.createBatch).toHaveBeenCalledWith(body);
  });
});
