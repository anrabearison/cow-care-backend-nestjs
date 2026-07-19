import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContactFieldsToOwners1784461160846 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if columns already exist to avoid errors
    const emailColumnExists = await queryRunner.hasColumn('owners', 'email');
    const phoneColumnExists = await queryRunner.hasColumn('owners', 'phone');
    const cityColumnExists = await queryRunner.hasColumn('owners', 'city');

    // Add email column if it doesn't exist
    if (!emailColumnExists) {
      await queryRunner.query(`
        ALTER TABLE "owners" 
        ADD COLUMN "email" character varying(255)
      `);
    }

    // Add phone column if it doesn't exist
    if (!phoneColumnExists) {
      await queryRunner.query(`
        ALTER TABLE "owners" 
        ADD COLUMN "phone" character varying(255)
      `);
    }

    // Add city column if it doesn't exist
    if (!cityColumnExists) {
      await queryRunner.query(`
        ALTER TABLE "owners" 
        ADD COLUMN "city" character varying(255)
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the columns in reverse order
    await queryRunner.query(`
      ALTER TABLE "owners" 
      DROP COLUMN IF EXISTS "city"
    `);

    await queryRunner.query(`
      ALTER TABLE "owners" 
      DROP COLUMN IF EXISTS "phone"
    `);

    await queryRunner.query(`
      ALTER TABLE "owners" 
      DROP COLUMN IF EXISTS "email"
    `);
  }
}
