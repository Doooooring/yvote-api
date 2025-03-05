import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class TimelineAddOrder1741174271802 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(
        'timeline',
        new TableColumn({
          name: 'order',
          type: 'int',
        }),
      );

      await queryRunner.query(`
        WITH ordered AS (
          SELECT id, newsId, ROW_NUMBER() OVER (PARTITION BY newsId ORDER BY date ASC, id ASC) as row_num
          FROM timeline
        )
        UPDATE timeline
        JOIN ordered ON timeline.id = ordered.id
        SET timeline.order = ordered.row_num;
      `);
    } catch (e) {
      await queryRunner.dropColumn('timeline', 'order');
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "timeline" DROP COLUMN "order";
      `);
  }
}
