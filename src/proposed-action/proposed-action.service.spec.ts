import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProposedActionSource,
  ProposedActionStatus,
  ProposedActionType,
} from 'src/interface/proposed-action';
import { ProposedActionRepository } from 'src/repository/proposed-action/proposed-action.repository';
import { ProposedActionService } from './proposed-action.service';

describe('ProposedActionService', () => {
  let service: ProposedActionService;
  let repo: { create: jest.Mock; list: jest.Mock };

  beforeEach(async () => {
    repo = {
      create: jest.fn(async (data) => ({ id: 1, ...data })),
      list: jest.fn(async () => []),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposedActionService,
        {
          provide: ProposedActionRepository,
          useValue: {
            ...repo,
            findById: jest.fn(),
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

  // ---------------------------------------------------------------
  // list() filter validation + forwarding (PR 1, added 2026-05-04)
  // ---------------------------------------------------------------
  describe('list — filter validation', () => {
    it('forwards single status as a one-element statuses array', async () => {
      await service.list({ statuses: [ProposedActionStatus.Waiting] });
      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ statuses: [ProposedActionStatus.Waiting] }),
      );
    });

    it('forwards multiple statuses unchanged for status IN', async () => {
      await service.list({
        statuses: [
          ProposedActionStatus.Waiting,
          ProposedActionStatus.Approved,
          ProposedActionStatus.Applied,
        ],
      });
      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({
          statuses: [
            ProposedActionStatus.Waiting,
            ProposedActionStatus.Approved,
            ProposedActionStatus.Applied,
          ],
        }),
      );
    });

    it('rejects unknown status in the statuses array', async () => {
      await expect(
        service.list({ statuses: ['waiting', 'made_up_status'] }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects unknown actionType', async () => {
      await expect(
        service.list({ actionType: 'finish_news' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('forwards a known actionType', async () => {
      await service.list({ actionType: ProposedActionType.Publish });
      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ actionType: ProposedActionType.Publish }),
      );
    });

    it('forwards note substring filter', async () => {
      await service.list({ note: 'fallback' });
      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({ note: 'fallback' }),
      );
    });

    it('parses createdAfter ISO string into a Date passed to repo', async () => {
      await service.list({ createdAfter: '2026-05-01T00:00:00Z' });
      const passed = repo.list.mock.calls[0][0];
      expect(passed.createdAfter).toBeInstanceOf(Date);
      expect((passed.createdAfter as Date).toISOString()).toBe(
        '2026-05-01T00:00:00.000Z',
      );
    });

    it('rejects malformed createdAfter with 400', async () => {
      await expect(
        service.list({ createdAfter: 'not-a-date' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects malformed createdBefore with 400', async () => {
      await expect(
        service.list({ createdBefore: 'still-not-a-date' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('forwards the Sunday-suggester compound query unchanged', async () => {
      // Single filtered call replaces the old 3-call status loop:
      // status IN (waiting, approved, applied) AND actionType=publish
      // AND newsId=251 — answers "is there already a publish PA for
      // news 251" in one query that hits idx_proposed_status +
      // idx_proposed_newsId.
      await service.list({
        statuses: [
          ProposedActionStatus.Waiting,
          ProposedActionStatus.Approved,
          ProposedActionStatus.Applied,
        ],
        actionType: ProposedActionType.Publish,
        newsId: 251,
        limit: 1,
      });
      expect(repo.list).toHaveBeenCalledWith(
        expect.objectContaining({
          statuses: [
            ProposedActionStatus.Waiting,
            ProposedActionStatus.Approved,
            ProposedActionStatus.Applied,
          ],
          actionType: ProposedActionType.Publish,
          newsId: 251,
          limit: 1,
        }),
      );
    });

    it('passes through with no filters (back-compat: returns all)', async () => {
      await service.list({});
      expect(repo.list).toHaveBeenCalledTimes(1);
      const opts = repo.list.mock.calls[0][0];
      expect(opts.statuses).toBeUndefined();
      expect(opts.actionType).toBeUndefined();
      expect(opts.note).toBeUndefined();
      expect(opts.createdAfter).toBeUndefined();
      expect(opts.createdBefore).toBeUndefined();
    });
  });
});
