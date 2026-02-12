import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeCommentDateToVarchar1770815868567 implements MigrationInterface {
    name = 'ChangeCommentDateToVarchar1770815868567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`NewsSummary\` CHANGE \`summary\` \`summary\` longtext NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`timeline\` DROP COLUMN \`commentType\``);
        await queryRunner.query(`ALTER TABLE \`timeline\` ADD \`commentType\` varchar(255) NOT NULL DEFAULT '기타'`);
        await queryRunner.query(`ALTER TABLE \`News\` CHANGE \`state\` \`state\` varchar(2) NOT NULL DEFAULT '2'`);
        await queryRunner.query(`ALTER TABLE \`Comment\` DROP COLUMN \`date\``);
        await queryRunner.query(`ALTER TABLE \`Comment\` ADD \`date\` varchar(10) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`Comment\` DROP COLUMN \`date\``);
        await queryRunner.query(`ALTER TABLE \`Comment\` ADD \`date\` timestamp NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` CHANGE \`state\` \`state\` varchar(2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`timeline\` DROP COLUMN \`commentType\``);
        await queryRunner.query(`ALTER TABLE \`timeline\` ADD \`commentType\` varchar(100) NOT NULL DEFAULT '기타'`);
        await queryRunner.query(`ALTER TABLE \`NewsSummary\` CHANGE \`summary\` \`summary\` longtext NULL`);
    }

}
