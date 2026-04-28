import { Test, TestingModule } from '@nestjs/testing';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { IncidentController } from './incident.controller';
import { IncidentService } from './incident.service';

describe('IncidentController', () => {
  let controller: IncidentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentController],
      providers: [
        {
          provide: IncidentService,
          useValue: {
            create: jest.fn(),
            list: jest.fn(),
            getById: jest.fn(),
            update: jest.fn(),
            dismiss: jest.fn(),
            resolve: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<IncidentController>(IncidentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const methodGuards = (methodName: keyof IncidentController) =>
    Reflect.getMetadata(
      GUARDS_METADATA,
      Object.getOwnPropertyDescriptor(IncidentController.prototype, methodName)
        ?.value,
    ) || [];

  it('does not apply the old AdminGuard to /adminjae2 incident endpoints', () => {
    for (const methodName of [
      'create',
      'list',
      'getById',
      'dismiss',
      'resolve',
      'update',
      'delete',
    ] as const) {
      expect(methodGuards(methodName)).toEqual([]);
    }
  });
});
