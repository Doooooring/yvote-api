import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgendaListToNews1766000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Column already exists, do nothing
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Do nothing
  }
}
