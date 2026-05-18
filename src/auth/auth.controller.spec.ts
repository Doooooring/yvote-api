import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AdminAuthService } from './admin/admin.service';
import { AuthController } from './auth.controller';
import { GoogleAuthService } from './google/google.service';
import { KakakoAuthService } from './kakao/kakao.service';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: KakakoAuthService,
          useValue: {},
        },
        {
          provide: GoogleAuthService,
          useValue: {},
        },
        {
          provide: AdminAuthService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
