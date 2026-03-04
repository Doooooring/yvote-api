import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameBillFields1772563406067 implements MigrationInterface {
    name = 'RenameBillFields1772563406067'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename billSummary -> billDetail (preserves data)
        await queryRunner.query(`ALTER TABLE \`News\` CHANGE COLUMN \`billSummary\` \`billDetail\` longtext NULL`);
        // Rename etcDebate -> billAmendment (preserves data)
        await queryRunner.query(`ALTER TABLE \`News\` CHANGE COLUMN \`etcDebate\` \`billAmendment\` longtext NULL`);
        // Add new billSummary column for citizen-friendly explanation
        await queryRunner.query(`ALTER TABLE \`News\` ADD COLUMN \`billSummary\` longtext NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`News\` DROP COLUMN \`billSummary\``);
        await queryRunner.query(`ALTER TABLE \`News\` CHANGE COLUMN \`billAmendment\` \`etcDebate\` longtext NULL`);
        await queryRunner.query(`ALTER TABLE \`News\` CHANGE COLUMN \`billDetail\` \`billSummary\` longtext NULL`);
    }
}
