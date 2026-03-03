import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBillDebateFields1771937423970 implements MigrationInterface {
    name = 'AddBillDebateFields1771937423970'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`proDebate\` longtext NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`conDebate\` longtext NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`etcDebate\` longtext NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`etcDebate\``);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`conDebate\``);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`proDebate\``);
    }

}
