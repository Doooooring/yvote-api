import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class CreateNewsSummaryTable1682752800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'NewsSummary',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'summary',
            type: 'longtext',
            isNullable: true,
          },
          {
            name: 'commentType',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'newsId',
            type: 'integer',
            isNullable: true,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'NewsSummary',
      new TableForeignKey({
        columnNames: ['newsId'],
        referencedTableName: 'News',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.query(`
        INSERT INTO NewsSummary (summary, commentType, newsId)
        SELECT n.summary,
               '와이보트'       AS commentType,
               n.id          AS newsId
        FROM   news n
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('NewsSummary');
  }
}
