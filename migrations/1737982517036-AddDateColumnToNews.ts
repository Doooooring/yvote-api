import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddDateColumnToNews1737982517036 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(
        'News',
        new TableColumn({
          name: 'date',
          type: 'timestamp',
          isNullable: true,
        }),
      );

      await queryRunner.query(`
        UPDATE News
        INNER JOIN (
          SELECT newsId, MAX(date) AS latest_date
          FROM timeline
          GROUP BY newsId
        ) AS sub ON News.id = sub.newsId
        SET News.date = sub.latest_date
      `);
    } catch (error) {
      await queryRunner.dropColumn('News', 'date');
      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('News', 'date');
  }
}
