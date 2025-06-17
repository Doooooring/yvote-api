import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateNewsDefaultSummary1749699664644
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE  News n
      Set summary = (
        Select summary from NewsSummary ns
        where n.id = ns.newsId
        and ns.commentType = '와이보트'
    );
    `);

    await queryRunner.query(`
        UPDATE NewsSummary ns
        Set commentType = '입법부'
        Where ns.commentType = '와이보트'
    `);

    await queryRunner.query(`
      UPDATE Comment c
        Set commentType = '입법부'
        Where c.commentType = '와이보트'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
