import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeSubTitleToText1773050026606 implements MigrationInterface {
    name = 'ChangeSubTitleToText1773050026606'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` MODIFY COLUMN \`subTitle\` text NOT NULL DEFAULT ''`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` MODIFY COLUMN \`subTitle\` varchar(255) NOT NULL DEFAULT ''`);
    }
}
