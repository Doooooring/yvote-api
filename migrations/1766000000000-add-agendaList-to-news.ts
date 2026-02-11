import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAgendaListToNews1766000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'News',
      new TableColumn({
        name: 'agendaList',
        type: 'text',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('News', 'agendaList');
  }
}
