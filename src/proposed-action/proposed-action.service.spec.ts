import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ProposedActionCreate,
  ProposedActionSource,
  ProposedActionStatus,
  ProposedActionType,
} from 'src/interface/proposed-action';
import { ProposedActionRepository } from 'src/repository/proposed-action/proposed-action.repository';
import { ProposedActionService } from './proposed-action.service';

describe('ProposedActionService', () => {
  let service: ProposedActionService;
  let repo: {
    create: jest.Mock;
    createBatch: jest.Mock;
    findById: jest.Mock;
    list: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  const existingNewsId = 1001;
  const targetNewsId = 1002;

  beforeEach(async () => {
    repo = {
      create: jest.fn(async (data) => ({ id: 1, ...data })),
      createBatch: jest.fn(async (actions) =>
        actions.map((data: ProposedActionCreate, index: number) => ({
          id: index + 1,
          ...data,
        })),
      ),
      findById: jest.fn(),
      list: jest.fn(async () => []),
      update: jest.fn(async (id, patch) => ({ id, ...patch })),
      delete: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProposedActionService,
        {
          provide: ProposedActionRepository,
          useValue: repo,
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
        newsId: existingNewsId,
        payload: {},
        source: ProposedActionSource.User,
      });
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ProposedActionType.FillNews,
          newsId: existingNewsId,
        }),
      );
    });

    it('accepts fill_news with generatedContent fast-path payload', async () => {
      await service.create({
        actionType: ProposedActionType.FillNews,
        newsId: existingNewsId,
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

  describe('create — route_comment', () => {
    it('accepts batched commentPayloads when each entry carries commentType', async () => {
      await service.create({
        actionType: ProposedActionType.RouteComment,
        newsId: targetNewsId,
        source: ProposedActionSource.ClaudeTriage,
        payload: {
          targetNewsId,
          commentPayloads: [
            { commentType: '입법부', body: 'first' },
            { commentType: '입법부', body: 'second' },
          ],
        },
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ProposedActionType.RouteComment,
          newsId: targetNewsId,
        }),
      );
    });
  });

  describe('create — split_comment', () => {
    it('accepts source replacement plus destination payloads', async () => {
      await service.create({
        actionType: ProposedActionType.SplitComment,
        newsId: targetNewsId,
        source: ProposedActionSource.ClaudeTriage,
        payload: {
          sourceNewsId: 1247,
          sourceCommentType: '한나라당',
          sourceCommentId: 45290,
          sourceRemainders: [
            { commentType: '한나라당', title: '나머지', comment: '본문' },
          ],
          destinations: [{
            targetNewsId,
            commentPayloads: [
              { commentType: '한나라당', title: '분리', comment: '본문' },
            ],
          }],
        },
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ProposedActionType.SplitComment,
          newsId: targetNewsId,
        }),
      );
    });

    it('accepts batched source replacements without top-level sourceNewsId', async () => {
      await service.create({
        actionType: ProposedActionType.SplitComment,
        newsId: targetNewsId,
        source: ProposedActionSource.ClaudeTriage,
        payload: {
          sourceReplacements: [
            {
              sourceNewsId: 1247,
              sourceCommentType: '한나라당',
              sourceCommentId: 45290,
              sourceRemainders: [
                { commentType: '한나라당', title: '나머지 1', comment: '본문' },
              ],
            },
            {
              sourceNewsId: 1242,
              sourceCommentType: '민주당',
              sourceCommentId: 45291,
              sourceRemainders: [
                { commentType: '민주당', title: '나머지 2', comment: '본문' },
              ],
            },
          ],
          destinations: [{
            targetNewsId,
            commentPayloads: [
              { commentType: '한나라당', title: '분리 1', comment: '본문' },
              { commentType: '민주당', title: '분리 2', comment: '본문' },
            ],
          }],
        },
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          actionType: ProposedActionType.SplitComment,
          newsId: targetNewsId,
        }),
      );
    });

    it('rejects batched source replacements missing sourceNewsId', async () => {
      await expect(
        service.create({
          actionType: ProposedActionType.SplitComment,
          newsId: targetNewsId,
          source: ProposedActionSource.ClaudeTriage,
          payload: {
            sourceReplacements: [
              {
                sourceCommentType: '한나라당',
                sourceCommentId: 45290,
                sourceRemainders: [
                  { commentType: '한나라당', title: '나머지', comment: '본문' },
                ],
              },
            ],
            destinations: [{
              targetNewsId,
              commentPayloads: [
                { commentType: '한나라당', title: '분리', comment: '본문' },
              ],
            }],
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('createBatch', () => {
    const validCreateNews = {
      actionType: ProposedActionType.CreateNews,
      payload: { title: 'Daily bill', newsType: 'plenary' },
      source: ProposedActionSource.ClaudeTriage,
    };

    it('rejects missing actions array', async () => {
      await expect(
        service.createBatch({} as { actions: ProposedActionCreate[] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.createBatch).not.toHaveBeenCalled();
    });

    it('rejects an empty actions array', async () => {
      await expect(
        service.createBatch({ actions: [] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.createBatch).not.toHaveBeenCalled();
    });

    it('validates every action before touching the repository', async () => {
      await expect(
        service.createBatch({
          actions: [
            validCreateNews,
            {
              actionType: 'finish_news' as ProposedActionType,
              payload: {},
              source: ProposedActionSource.User,
            },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repo.createBatch).not.toHaveBeenCalled();
    });

    it('forwards valid actions to one repository batch call', async () => {
      await service.createBatch({
        actions: [
          validCreateNews,
          {
            actionType: ProposedActionType.RouteComment,
            newsId: targetNewsId,
            source: ProposedActionSource.ClaudeTriage,
            payload: {
              targetNewsId,
              commentPayload: { body: 'comment' },
              commentType: '입법부',
            },
          },
        ],
      });

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.createBatch).toHaveBeenCalledTimes(1);
      expect(repo.createBatch).toHaveBeenCalledWith([
        validCreateNews,
        expect.objectContaining({
          actionType: ProposedActionType.RouteComment,
          newsId: targetNewsId,
        }),
      ]);
    });

    it('accepts a batched split_comment action', async () => {
      const splitAction = {
        actionType: ProposedActionType.SplitComment,
        newsId: targetNewsId,
        source: ProposedActionSource.ClaudeTriage,
        payload: {
          sourceReplacements: [
            {
              sourceNewsId: 1247,
              sourceCommentType: '한나라당',
              sourceCommentId: 45290,
              sourceRemainders: [
                { commentType: '한나라당', title: '나머지', comment: '본문' },
              ],
            },
          ],
          destinations: [{
            targetNewsId,
            commentPayloads: [
              { commentType: '한나라당', title: '분리', comment: '본문' },
            ],
          }],
        },
      };

      await service.createBatch({
        actions: [validCreateNews, splitAction],
      });

      expect(repo.create).not.toHaveBeenCalled();
      expect(repo.createBatch).toHaveBeenCalledTimes(1);
      expect(repo.createBatch).toHaveBeenCalledWith([
        validCreateNews,
        expect.objectContaining({
          actionType: ProposedActionType.SplitComment,
          newsId: targetNewsId,
        }),
      ]);
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

  describe('status transitions', () => {
    it('allows approve only from waiting', async () => {
      repo.findById.mockResolvedValue({
        id: 21,
        status: ProposedActionStatus.Waiting,
        appliedAt: null,
      });

      await service.approve(21);

      expect(repo.update).toHaveBeenCalledWith(21, {
        status: ProposedActionStatus.Approved,
      });
    });

    it('blocks approving a rejected action', async () => {
      repo.findById.mockResolvedValue({
        id: 22,
        status: ProposedActionStatus.Rejected,
        appliedAt: null,
      });

      await expect(service.approve(22)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('blocks rejecting an approved action', async () => {
      repo.findById.mockResolvedValue({
        id: 23,
        status: ProposedActionStatus.Approved,
        appliedAt: null,
      });

      await expect(service.reject(23)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('blocks rejecting an already applied action', async () => {
      repo.findById.mockResolvedValue({
        id: 24,
        status: ProposedActionStatus.Applied,
        appliedAt: '2026-05-05T00:00:00.000Z',
      });

      await expect(service.reject(24)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('allows markApplied only from approved', async () => {
      repo.findById.mockResolvedValue({
        id: 25,
        status: ProposedActionStatus.Approved,
        appliedAt: null,
      });

      await service.markApplied(25);

      expect(repo.update).toHaveBeenCalledWith(25, {
        status: ProposedActionStatus.Applied,
      });
    });

    it('blocks generic PATCH status jumps that bypass approve/reject', async () => {
      repo.findById.mockResolvedValue({
        id: 26,
        status: ProposedActionStatus.Rejected,
        appliedAt: null,
      });

      await expect(
        service.update(26, { status: ProposedActionStatus.Approved }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('allows generic PATCH note updates without status changes', async () => {
      await service.update(27, { note: 'fallbackProcessed' });

      expect(repo.findById).not.toHaveBeenCalled();
      expect(repo.update).toHaveBeenCalledWith(27, {
        note: 'fallbackProcessed',
      });
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
