import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBillSummary1772525374661 implements MigrationInterface {
    name = 'AddBillSummary1772525374661'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`billSummary\` longtext NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`billSummary\``);
    }
}
