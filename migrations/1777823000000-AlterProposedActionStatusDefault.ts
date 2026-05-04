import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Follow-up to RenameProposedActionPendingToWaiting1777822084423.
 *
 * The first migration rewrote existing rows from 'pending' to 'waiting'
 * but did NOT alter the column DEFAULT. So new INSERTs that omit the
 * `status` field were still picking up MySQL's column default of
 * 'pending', defeating the rename for any new row created after the
 * first migration ran.
 *
 * This follow-up does only one thing: ALTER COLUMN ... SET DEFAULT
 * 'waiting'. No row-level UPDATE — every existing row is already
 * 'waiting' (or has progressed to approved/applied/rejected/obsolete)
 * thanks to the first migration.
 *
 * Safe to run on a live DB:
 *   - Single ALTER on a low-traffic column. No data is rewritten.
 *   - No type/length change. Column stays varchar(16) NOT NULL.
 *   - down() reverses to DEFAULT 'pending' so the migration can be
 *     rolled back independently of the first migration's revert.
 */
export class AlterProposedActionStatusDefault1777823000000
  implements MigrationInterface
{
  name = "AlterProposedActionStatusDefault1777823000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`ProposedAction\`
      MODIFY \`status\` varchar(16) NOT NULL DEFAULT 'waiting'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`ProposedAction\`
      MODIFY \`status\` varchar(16) NOT NULL DEFAULT 'pending'
    `);
  }
}
