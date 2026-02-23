import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeCommentDateToVarchar1771100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Convert existing timestamp values to YYYY-MM-DD strings before altering
    await queryRunner.query(`
      UPDATE Comment SET date = DATE_FORMAT(date, '%Y-%m-%d') WHERE date IS NOT NULL
    `);
    // Change date column from timestamp to varchar(10)
    await queryRunner.query(`
      ALTER TABLE Comment MODIFY COLUMN date VARCHAR(10) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE Comment MODIFY COLUMN date TIMESTAMP NULL
    `);
  }
}
