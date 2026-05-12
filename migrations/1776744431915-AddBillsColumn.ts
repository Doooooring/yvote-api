import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBillsColumn1776744431915 implements MigrationInterface {
    name = 'AddBillsColumn1776744431915'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`bills\` longtext NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`bills\``);
    }

}
