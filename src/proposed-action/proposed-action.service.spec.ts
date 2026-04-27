import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProposedActionSource,
  ProposedActionType,
} from 'src/interface/proposed-action';
import { ProposedActionRepository } from 'src/repository/proposed-action/proposed-action.repository';
import { ProposedActionService } from './proposed-action.service';

describe('ProposedActionService', () => {
  let service: ProposedActionService;
  let repo: { create: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn(async (data) => ({ id: 1, ...data })),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposedActionService,
        {
          provide: ProposedActionRepository,
          useValue: {
            ...repo,
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

  describe('create — fill_news (added 2026-04-28, single-tier rule)', () => {
    it('rejects fill_news without top-level newsId', async () => {
      await expect(
        service.create({
          actionType: ProposedActionType.FillNews,
          payload: {},
          source: ProposedActionSource.User,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('accepts fill_news with newsId (payload optional)', async () => {
      await service.create({
        actionType: ProposedActionType.FillNews,
        newsId: 42,
        payload: {},
        source: ProposedActionSource.User,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ProposedActionType.FillNews,
          newsId: 42,
        }),
      );
    });

    it('accepts fill_news with generatedContent fast-path payload', async () => {
      await service.create({
        actionType: ProposedActionType.FillNews,
        newsId: 42,
        payload: { generatedContent: { subTitle: 'x' } },
        source: ProposedActionSource.ClaudeFinished,
      });
      expect(repo.create).toHaveBeenCalled();
    });
  });

  describe('create — edit_comment', () => {
    it('rejects edit_comment without newsId', async () => {
      await expect(
        service.create({
          actionType: ProposedActionType.EditComment,
          payload: { commentType: '입법부' },
          source: ProposedActionSource.User,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('create — actionType allowlist', () => {
    it('rejects unknown actionType', async () => {
      await expect(
        service.create({
          actionType: 'finish_news' as ProposedActionType,
          payload: {},
          source: ProposedActionSource.User,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
