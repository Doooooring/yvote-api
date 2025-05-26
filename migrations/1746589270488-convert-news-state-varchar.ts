import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ConvertNewsStateVarchar1746589270488
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'news',
      'state',
      new TableColumn({
        name: 'state',
        type: 'varchar',
        length: '2',
        isNullable: false,
        default: `'0'`,
      }),
    );

    await queryRunner.query(`
      UPDATE NEWS
      SET state = CASE
        WHEN isPublished = 1 THEN '0'
        WHEN isPublished = 0 THEN '2'
        ELSE '1'
      END;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      'news',
      'state',
      new TableColumn({
        name: 'state',
        type: 'tinyint',
        width: 1,
        unsigned: true,
        isNullable: false,
        default: '0',
      }),
    );
  }
}
