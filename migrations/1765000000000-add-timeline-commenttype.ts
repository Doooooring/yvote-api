import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTimelineCommentType1765000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.addColumn(
        'timeline',
        new TableColumn({
          name: 'commentType',
          type: 'varchar',
          length: '100',
          isNullable: false,
          default: "'기타'",
        }),
      );

      // Ensure existing rows have a default
      await queryRunner.query(`UPDATE timeline SET commentType = '기타' WHERE commentType IS NULL OR commentType = ''`);
    } catch (e) {
      await queryRunner.dropColumn('timeline', 'commentType');
      throw e;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "timeline" DROP COLUMN "commentType"`);
  }
}
