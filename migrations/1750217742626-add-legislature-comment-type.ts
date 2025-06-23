import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 와이보트에 존재하는 논평들을 입법부로 전부 옮길 것
 * 1차 과정으로 와이보트 논평이 하나라도 존재할 경우 NewsSummary에도 입법부를 넣어줌
 * (단 입법부가 존재할 시 배제함)
 */
export class AddLegislatureCommentType1750217742626
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        INSERT INTO NewsSummary (summary, commentType, newsId)
        Select '' as summary, '입법부' as commentType, n.id as newsId
        FROM News n
        where exists (
            select 1 from Comment C
            where C.newsId = n.id
            and C.commentType = '와이보트'
        )
        AND
            not exists (
            select 1 from NewsSummary ns
            where ns.commentType = '입법부'
            and ns.newsId = n.id
        );
    `);

    await queryRunner.query(`
        UPDATE Comment C
        SET commentType = '입법부'
        where C.commentType = '와이보트';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
