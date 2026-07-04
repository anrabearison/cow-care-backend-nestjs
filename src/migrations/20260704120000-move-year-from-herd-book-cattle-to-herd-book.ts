import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveYearFromHerdBookCattleToHerdBook20260704120000 implements MigrationInterface {
  name = 'MoveYearFromHerdBookCattleToHerdBook20260704120000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "herd_books"
      ADD COLUMN "year" integer
    `);

    await queryRunner.query(`
      UPDATE "herd_books" hb
      SET "year" = COALESCE(
        (
          SELECT MIN(hbc.year)
          FROM "herd_book_cattle" hbc
          WHERE hbc.herd_book_id = hb.id
        ),
        EXTRACT(YEAR FROM CURRENT_DATE)::int
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "herd_books"
      ALTER COLUMN "year" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "herd_book_cattle"
      DROP CONSTRAINT IF EXISTS "UQ_hbc_herdbook_cattle_year"
    `);

    await queryRunner.query(`
      ALTER TABLE "herd_book_cattle"
      DROP COLUMN IF EXISTS "year"
    `);

    await queryRunner.query(`
      ALTER TABLE "herd_book_cattle"
      ADD CONSTRAINT "UQ_hbc_herdbook_cattle"
      UNIQUE ("herd_book_id", "cattle_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "herd_book_cattle"
      DROP CONSTRAINT IF EXISTS "UQ_hbc_herdbook_cattle"
    `);

    await queryRunner.query(`
      ALTER TABLE "herd_book_cattle"
      ADD COLUMN "year" integer
    `);

    await queryRunner.query(`
      UPDATE "herd_book_cattle" hbc
      SET "year" = (
        SELECT hb.year
        FROM "herd_books" hb
        WHERE hb.id = hbc.herd_book_id
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "herd_book_cattle"
      ALTER COLUMN "year" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "herd_book_cattle"
      ADD CONSTRAINT "UQ_hbc_herdbook_cattle_year"
      UNIQUE ("herd_book_id", "cattle_id", "year")
    `);

    await queryRunner.query(`
      ALTER TABLE "herd_books"
      DROP COLUMN IF EXISTS "year"
    `);
  }
}
