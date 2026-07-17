import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerIdToSuppliers1784279679344 implements MigrationInterface {
    name = 'AddOwnerIdToSuppliers1784279679344'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if owner_id column already exists and its type
        const columnInfo = await queryRunner.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'suppliers' 
            AND column_name = 'owner_id'
        `);
        
        // Step 1: Add owner_id column as nullable if it doesn't exist
        if (columnInfo.length === 0) {
            await queryRunner.query(`ALTER TABLE "suppliers" ADD "owner_id" uuid`);
        } else if (columnInfo[0].data_type === 'character varying') {
            // Column exists but is varchar - convert to uuid
            await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "owner_id" TYPE uuid USING owner_id::uuid`);
        }

        // Step 2: Check if there are existing suppliers without ownerId
        const existingSuppliers = await queryRunner.query(`
            SELECT COUNT(*) as count FROM suppliers WHERE owner_id IS NULL
        `);
        
        const count = parseInt(existingSuppliers[0]?.count || '0');
        
        if (count > 0) {
            // Step 3: Check how many owners exist
            const ownersCount = await queryRunner.query(`
                SELECT COUNT(*) as count FROM owners
            `);
            
            const ownerCount = parseInt(ownersCount[0]?.count || '0');
            
            if (ownerCount === 0) {
                // No owners exist - keep column nullable, manual intervention required
                console.log('WARNING: No owners found. Added owner_id as nullable. Manual intervention required.');
                return;
            } else if (ownerCount > 1) {
                // Multiple owners exist - assign to the first one with a warning (development safety)
                console.log('WARNING: Multiple owners exist. Assigning orphaned suppliers to the first owner found.');
            }
            
            // Get the first owner (works for both single and multiple owner cases)
            const firstOwner = await queryRunner.query(`
                SELECT id FROM owners LIMIT 1
            `);
            
            if (firstOwner.length > 0) {
                const ownerId = firstOwner[0].id;
                // Assign existing suppliers to the first owner using parameterized query
                await queryRunner.query(
                    `UPDATE suppliers SET owner_id = $1 WHERE owner_id IS NULL`,
                    [ownerId]
                );
            }
        }
        
        // Step 4: Once all rows are filled, set column to NOT NULL
        await queryRunner.query(`ALTER TABLE "suppliers" ALTER COLUMN "owner_id" SET NOT NULL`);
        
        // Step 5: Check if foreign key constraint already exists
        const constraintExists = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'suppliers' 
            AND constraint_name = 'FK_suppliers_owner_id'
        `);
        
        // Step 6: Add foreign key constraint if it doesn't exist
        if (constraintExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_suppliers_owner_id" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT IF EXISTS "FK_suppliers_owner_id"`);
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN IF EXISTS "owner_id"`);
    }
}
