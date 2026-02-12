import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeDateColumnToVarchar1770000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Change date column from timestamp to varchar(10)
    await queryRunner.query(`
      ALTER TABLE News MODIFY COLUMN date VARCHAR(10) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert back to timestamp
    await queryRunner.query(`
      ALTER TABLE News MODIFY COLUMN date TIMESTAMP NULL
    `);
  }
}