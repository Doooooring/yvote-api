import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResetLeanNews1780000000000 implements MigrationInterface {
  name = 'ResetLeanNews1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Incident는 ProposedAction을 FK로 참조하므로 먼저 드롭
    await queryRunner.query('DROP TABLE IF EXISTS `Incident`');
    await queryRunner.query('DROP TABLE IF EXISTS `ProposedAction`');

    // News 슬림화: 자동화 시절 컬럼 제거
    await queryRunner.query(
      'ALTER TABLE `News` ' +
        'DROP COLUMN `order`, ' +
        'DROP COLUMN `isPublished`, ' +
        'DROP COLUMN `agendaList`, ' +
        'DROP COLUMN `speechContent`, ' +
        'DROP COLUMN `billAmendment`, ' +
        'DROP COLUMN `billSummary`, ' +
        'DROP COLUMN `billDetail`, ' +
        'DROP COLUMN `billVoteResult`, ' +
        'DROP COLUMN `billVoteTotal`, ' +
        'DROP COLUMN `billVoteByParty`, ' +
        'DROP COLUMN `bills`, ' +
        'DROP COLUMN `rationale`, ' +
        'DROP COLUMN `tracked`, ' +
        'DROP COLUMN `trackedNote`',
    );

    // 타입별 자유 필드용 JSON 컬럼
    await queryRunner.query('ALTER TABLE `News` ADD `detail` json NULL');

    // 전문검색 인덱스를 (title) → (title, subTitle) 로 교체
    await queryRunner.query('DROP INDEX `ft_news_title` ON `News`');
    await queryRunner.query(
      'CREATE FULLTEXT INDEX `ft_news_title` ON `News` (`title`, `subTitle`)',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX `ft_news_title` ON `News`');
    await queryRunner.query(
      'CREATE FULLTEXT INDEX `ft_news_title` ON `News` (`title`)',
    );
    await queryRunner.query('ALTER TABLE `News` DROP COLUMN `detail`');
    await queryRunner.query(
      'ALTER TABLE `News` ' +
        "ADD `order` int NOT NULL DEFAULT '0', " +
        'ADD `isPublished` tinyint NOT NULL DEFAULT 0, ' +
        'ADD `agendaList` longtext NULL, ' +
        'ADD `speechContent` longtext NULL, ' +
        'ADD `billAmendment` longtext NULL, ' +
        'ADD `billSummary` longtext NULL, ' +
        'ADD `billDetail` longtext NULL, ' +
        'ADD `billVoteResult` varchar(50) NULL, ' +
        'ADD `billVoteTotal` int NULL, ' +
        'ADD `billVoteByParty` text NULL, ' +
        'ADD `bills` text NULL, ' +
        'ADD `rationale` text NULL, ' +
        'ADD `tracked` tinyint NOT NULL DEFAULT 0, ' +
        'ADD `trackedNote` text NULL',
    );
  }
}
