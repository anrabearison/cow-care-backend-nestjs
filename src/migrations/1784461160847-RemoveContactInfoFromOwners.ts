import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveContactInfoFromOwners1784461160847 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Remove contact_info column if it exists
    const columnExists = await queryRunner.hasColumn('owners', 'contact_info');
    
    if (columnExists) {
      await queryRunner.query(`
        ALTER TABLE "owners" 
        DROP COLUMN "contact_info"
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-add the column for rollback
    const columnExists = await queryRunner.hasColumn('owners', 'contact_info');
    
    if (!columnExists) {
      await queryRunner.query(`
        ALTER TABLE "owners" 
        ADD COLUMN "contact_info" character varying(255)
      `);
    }
  }
}
