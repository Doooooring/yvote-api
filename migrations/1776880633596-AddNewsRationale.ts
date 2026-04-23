import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewsRationale1776880633596 implements MigrationInterface {
    name = 'AddNewsRationale1776880633596'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`rationale\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`rationale\``);
    }

}
