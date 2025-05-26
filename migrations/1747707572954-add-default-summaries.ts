import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultSummaries1747707572954 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            INSERT INTO newsSummary (summary, commentType, newsId)
            SELECT '' AS summary, CC.commentType, CC.newsId
            FROM 
            (
                select C.newsId newsId, C.commentType commentType from Comment C 
                group by C.newsId, C.commentType    
            ) CC
            LEFT JOIN NewsSummary NS
            ON CC.newsId = NS.newsId AND CC.commentType = NS.commentType
            WHERE NS.newsId IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
