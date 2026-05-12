import { DataSource, Repository } from 'typeorm';
import { ProposedAction } from 'src/entity/proposed-action.entity';
import {
  ProposedActionCreate,
  ProposedActionSource,
  ProposedActionType,
} from 'src/interface/proposed-action';
import { ProposedActionRepository } from './proposed-action.repository';

describe('ProposedActionRepository', () => {
  const targetNewsId = 1002;

  let baseRepo: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let transactionRepo: {
    create: jest.Mock;
    save: jest.Mock;
  };
  let transactionManager: {
    getRepository: jest.Mock;
  };
  let dataSource: {
    transaction: jest.Mock;
  };
  let repository: ProposedActionRepository;

  beforeEach(() => {
    baseRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };
    transactionRepo = {
      create: jest.fn((data) => ({ entity: data })),
      save: jest.fn(async (entities) =>
        entities.map((entity: object, index: number) => ({
          id: index + 1,
          ...entity,
        })),
      ),
    };
    transactionManager = {
      getRepository: jest.fn(() => transactionRepo),
    };
    dataSource = {
      transaction: jest.fn(async (work) => work(transactionManager)),
    };

    repository = new ProposedActionRepository(
      dataSource as unknown as DataSource,
      baseRepo as unknown as Repository<ProposedAction>,
    );
  });

  it('creates all rows inside one TypeORM transaction', async () => {
    const actions: ProposedActionCreate[] = [
      {
        actionType: ProposedActionType.CreateNews,
        payload: { title: 'Daily bill', newsType: 'plenary' },
        source: ProposedActionSource.ClaudeTriage,
      },
      {
        actionType: ProposedActionType.RouteComment,
        newsId: targetNewsId,
        payload: {
          targetNewsId,
          commentType: '입법부',
          commentPayload: { body: 'comment' },
        },
        source: ProposedActionSource.ClaudeTriage,
        note: 'tracked-news route',
      },
    ];

    const rows = await repository.createBatch(actions);

    expect(dataSource.transaction).toHaveBeenCalledTimes(1);
    expect(transactionManager.getRepository).toHaveBeenCalledWith(ProposedAction);
    expect(transactionRepo.create).toHaveBeenNthCalledWith(1, {
      actionType: ProposedActionType.CreateNews,
      payload: { title: 'Daily bill', newsType: 'plenary' },
      source: ProposedActionSource.ClaudeTriage,
      newsId: null,
      note: null,
    });
    expect(transactionRepo.create).toHaveBeenNthCalledWith(2, {
      actionType: ProposedActionType.RouteComment,
      payload: {
        targetNewsId,
        commentType: '입법부',
        commentPayload: { body: 'comment' },
      },
      source: ProposedActionSource.ClaudeTriage,
      newsId: targetNewsId,
      note: 'tracked-news route',
    });
    expect(transactionRepo.save).toHaveBeenCalledWith([
      {
        entity: {
          actionType: ProposedActionType.CreateNews,
          payload: { title: 'Daily bill', newsType: 'plenary' },
          source: ProposedActionSource.ClaudeTriage,
          newsId: null,
          note: null,
        },
      },
      {
        entity: {
          actionType: ProposedActionType.RouteComment,
          payload: {
            targetNewsId,
            commentType: '입법부',
            commentPayload: { body: 'comment' },
          },
          source: ProposedActionSource.ClaudeTriage,
          newsId: targetNewsId,
          note: 'tracked-news route',
        },
      },
    ]);
    expect(baseRepo.save).not.toHaveBeenCalled();
    expect(rows).toHaveLength(2);
  });
});
