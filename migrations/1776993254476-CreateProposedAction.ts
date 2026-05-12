import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProposedAction1776993254476 implements MigrationInterface {
    name = 'CreateProposedAction1776993254476'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`ProposedAction\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`createdAt\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`actionType\` varchar(32) NOT NULL,
                \`payload\` longtext NOT NULL,
                \`status\` varchar(16) NOT NULL DEFAULT 'pending',
                \`appliedAt\` timestamp NULL,
                \`newsId\` int NULL,
                \`source\` varchar(32) NOT NULL,
                \`note\` text NULL,
                PRIMARY KEY (\`id\`),
                INDEX \`idx_proposed_status\` (\`status\`),
                INDEX \`idx_proposed_newsId\` (\`newsId\`),
                CONSTRAINT \`fk_proposed_news\`
                  FOREIGN KEY (\`newsId\`) REFERENCES \`News\`(\`id\`)
                  ON DELETE SET NULL ON UPDATE NO ACTION
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`ProposedAction\``);
    }
}
