import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Rename ProposedAction.status value 'pending' → 'waiting'.
 *
 * Motivation: 'pending' is overloaded — News.state also uses 'pending'
 * (= draft, =1). Disambiguating the ProposedAction status value to
 * 'waiting' makes log lines, /adminjae2 badges, and code search
 * unambiguous about which lifecycle is in play.
 *
 * Cross-repo coordination (2026-05-04, PR 0):
 *   - yvote-api: enum ProposedActionStatus.Pending → .Waiting
 *     (interface + entity default), this migration runs the data
 *     update on existing rows.
 *   - yvote_automation: company/infra/db/proposed_actions.py constant
 *     Status.PENDING → Status.WAITING; callers updated in lockstep.
 *   - yvote_next (/adminjae2): utils/interface/proposedAction enum
 *     value updated; React queryKey + status filter follow the enum.
 *
 * NOTE on the column DEFAULT: this migration does NOT alter the
 * MySQL column DEFAULT. That responsibility lives in the follow-up
 * migration `AlterProposedActionStatusDefault1777823000000`. Keeping
 * data updates and schema changes in separate files makes each
 * migration single-purpose and trivially revertable.
 *
 * Safe to run on a live DB:
 *   - Single UPDATE on a small table (low hundreds of rows expected).
 *   - No schema change.
 *   - down() inverts cleanly.
 */
export class RenameProposedActionPendingToWaiting1777822084423
  implements MigrationInterface
{
  name = "RenameProposedActionPendingToWaiting1777822084423";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`ProposedAction\`
      SET \`status\` = 'waiting'
      WHERE \`status\` = 'pending'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE \`ProposedAction\`
      SET \`status\` = 'pending'
      WHERE \`status\` = 'waiting'
    `);
  }
}
