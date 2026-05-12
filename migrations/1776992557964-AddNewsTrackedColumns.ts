import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNewsTrackedColumns1776992557964 implements MigrationInterface {
    name = 'AddNewsTrackedColumns1776992557964'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`News\` ADD \`tracked\` tinyint(1) NOT NULL DEFAULT 0`
        );
        await queryRunner.query(
            `ALTER TABLE \`News\` ADD \`trackedNote\` text NULL`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`trackedNote\``);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`tracked\``);
    }
}
