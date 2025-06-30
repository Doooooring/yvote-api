import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 논평 주체가 입법부인 논평 중 제목에 국무회의가 포함될 경우
 * 행정부로 추가하는 마이그레이션
 * ( 이 과정에서 order를 max order 부터 하나씩 추가 해야함 )
 */
export class ConvertToAdminstration1750304588855 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const maxOrders = await queryRunner.query(`
            Select C.newsId, Max(C.order) maxOrder From Comment C
            where C.commentType = '행정부'
            group by C.newsId, C.commentType;
    `);

    const idCommentTypeMap = {} as {
      [key: number]: number;
    };

    maxOrders.forEach((row: { newsId: number; maxOrder: number }) => {
      idCommentTypeMap[row.newsId] = row.maxOrder;
    });

    const targets = (await queryRunner.query(`
        Select  C.id, C.newsId  from Comment C
        where C.commentType = '입법부' AND C.title Like '%국무회의%'
        Order By C.newsId, C.order ASC;
    `)) as Array<{
      id: number;
      newsId: number;
    }>;

    for (const target of targets) {
      const { id, newsId } = target;
      if (idCommentTypeMap[newsId] === undefined) {
        idCommentTypeMap[newsId] = 0;
      }
      const maxOrder = idCommentTypeMap[newsId];

      const result = await queryRunner.query(`
        Select 1 from NewsSummary ns
        where ns.newsId = ${newsId} and ns.commentType = '행정부';
      `);

      if (result.length === 0) {
        await queryRunner.query(`
            INSERT INTO NewsSummary (summary, commentType, newsId)
            VALUES ('', '행정부', ${newsId});
        `);
      }

      await queryRunner.query(`
            Update Comment C
            Set C.commentType = '행정부', C.order = ${maxOrder + 1}
            where C.id = ${id}
            ;
     `);
      idCommentTypeMap[newsId] += 1;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
