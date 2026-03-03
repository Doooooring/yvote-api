import { MigrationInterface, QueryRunner } from "typeorm";

export class RenamePresidentialOfficeCommentType1772468232091 implements MigrationInterface {
    name = 'RenamePresidentialOfficeCommentType1772468232091'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE \`Comment\` SET \`commentType\` = '청와대' WHERE \`commentType\` = '대통령실'`);
        await queryRunner.query(`UPDATE \`NewsSummary\` SET \`commentType\` = '청와대' WHERE \`commentType\` = '대통령실'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE \`Comment\` SET \`commentType\` = '대통령실' WHERE \`commentType\` = '청와대'`);
        await queryRunner.query(`UPDATE \`NewsSummary\` SET \`commentType\` = '대통령실' WHERE \`commentType\` = '청와대'`);
    }
}
