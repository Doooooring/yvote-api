import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBillVoteFields1772017862930 implements MigrationInterface {
    name = 'AddBillVoteFields1772017862930'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`voteResult\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`voteTotal\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` ADD \`voteByParty\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`NewsSummary\` CHANGE \`summary\` \`summary\` longtext NOT NULL DEFAULT ''`);
        await queryRunner.query(`ALTER TABLE \`timeline\` DROP COLUMN \`commentType\``);
        await queryRunner.query(`ALTER TABLE \`timeline\` ADD \`commentType\` varchar(255) NOT NULL DEFAULT '기타'`);
        await queryRunner.query(`ALTER TABLE \`News\` CHANGE \`state\` \`state\` varchar(2) NOT NULL DEFAULT '2'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` CHANGE \`state\` \`state\` varchar(2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`timeline\` DROP COLUMN \`commentType\``);
        await queryRunner.query(`ALTER TABLE \`timeline\` ADD \`commentType\` varchar(100) NOT NULL DEFAULT '기타'`);
        await queryRunner.query(`ALTER TABLE \`NewsSummary\` CHANGE \`summary\` \`summary\` longtext NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`voteByParty\``);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`voteTotal\``);
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`voteResult\``);
    }

}
