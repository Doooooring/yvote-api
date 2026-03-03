import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameBillVoteFields1772018180415 implements MigrationInterface {
    name = 'RenameBillVoteFields1772018180415'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`voteByParty\``);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`voteResult\``);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`voteTotal\``);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`billVoteResult\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`billVoteTotal\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`billVoteByParty\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`NewsSummary\` CHANGE \`summary\` \`summary\` longtext NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`NewsSummary\` CHANGE \`summary\` \`summary\` longtext NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`billVoteByParty\``);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`billVoteTotal\``);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`billVoteResult\``);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`voteTotal\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`voteResult\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`voteByParty\` text NULL`);
    }

}
