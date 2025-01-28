import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDateColumnToNews1737982517036 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(
        'news',
        new TableColumn({
          name: 'date',
          type: 'timestamp',
          isNullable: true,
        }),
      );

      await queryRunner.query(`
        UPDATE news
        INNER JOIN (
          SELECT newsId, MAX(date) AS latest_date
          FROM timeline
          GROUP BY newsId
        ) AS sub ON news.id = sub.newsId
        SET news.date = sub.latest_date
      `);
    } catch (error) {
      await queryRunner.dropColumn('news', 'date');
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('news', 'date');
  }
}
