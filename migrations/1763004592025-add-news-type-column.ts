import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNewsTypeColumn1763004592025 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(
        'News',
        new TableColumn({
          name: 'newsType',
          type: 'varchar',
          default: "'others'",
        }),
      );
    } catch (error) {
      console.log(
        'DB Migration Error (1763004592025-add-news-type-column): ',
        error,
      );

      throw error;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
