import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTimelineCommentType1772468740843 implements MigrationInterface {
    name = 'FixTimelineCommentType1772468740843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE timeline SET commentType = '청와대' WHERE commentType = '대통령실'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE timeline SET commentType = '대통령실' WHERE commentType = '청와대'`);
    }
}
