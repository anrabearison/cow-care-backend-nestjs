import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHasCompletedInitialImportToOwners1784461160845 implements MigrationInterface {
    name = 'AddHasCompletedInitialImportToOwners1784461160845';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists first
        const tableExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'owners' 
                AND column_name = 'has_completed_initial_import'
            );
        `);

        if (!tableExists[0].exists) {
            await queryRunner.query(`
                ALTER TABLE "owners" 
                ADD COLUMN "has_completed_initial_import" boolean NOT NULL DEFAULT false
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "owners" 
            DROP COLUMN "has_completed_initial_import"
        `);
    }
}
