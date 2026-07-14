import { MigrationInterface, QueryRunner, TableForeignKey, TableColumn } from 'typeorm';

export class AddOrganizationToBusinessEntities1234567890124 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add organization_id to cattle table
        await queryRunner.addColumn(
            'cattle',
            new TableColumn({
                name: 'organization_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_cattle_organization_id" ON "cattle" ("organization_id")`,
        );

        await queryRunner.createForeignKey(
            'cattle',
            new TableForeignKey({
                name: 'FK_cattle_organization',
                columnNames: ['organization_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'organizations',
                onDelete: 'SET NULL',
            }),
        );

        // Add organization_id to purchases table
        await queryRunner.addColumn(
            'purchases',
            new TableColumn({
                name: 'organization_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_purchase_organization_id" ON "purchases" ("organization_id")`,
        );

        await queryRunner.createForeignKey(
            'purchases',
            new TableForeignKey({
                name: 'FK_purchase_organization',
                columnNames: ['organization_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'organizations',
                onDelete: 'SET NULL',
            }),
        );

        // Add organization_id to herd_books table
        await queryRunner.addColumn(
            'herd_books',
            new TableColumn({
                name: 'organization_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_herd_book_organization_id" ON "herd_books" ("organization_id")`,
        );

        await queryRunner.createForeignKey(
            'herd_books',
            new TableForeignKey({
                name: 'FK_herd_book_organization',
                columnNames: ['organization_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'organizations',
                onDelete: 'SET NULL',
            }),
        );

        // Add organization_id to veterinarians table
        await queryRunner.addColumn(
            'veterinarians',
            new TableColumn({
                name: 'organization_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_veterinarian_organization_id" ON "veterinarians" ("organization_id")`,
        );

        await queryRunner.createForeignKey(
            'veterinarians',
            new TableForeignKey({
                name: 'FK_veterinarian_organization',
                columnNames: ['organization_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'organizations',
                onDelete: 'SET NULL',
            }),
        );

        // Add organization_id to suppliers table
        await queryRunner.addColumn(
            'suppliers',
            new TableColumn({
                name: 'organization_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.query(
            `CREATE INDEX "IDX_supplier_organization_id" ON "suppliers" ("organization_id")`,
        );

        await queryRunner.createForeignKey(
            'suppliers',
            new TableForeignKey({
                name: 'FK_supplier_organization',
                columnNames: ['organization_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'organizations',
                onDelete: 'SET NULL',
            }),
        );

        // Data migration: Associate existing data with organizations based on owner relationships
        // This is a safe migration that preserves data integrity
        await queryRunner.query(`
            UPDATE cattle 
            SET organization_id = u.organization_id 
            FROM users u 
            WHERE cattle.owner_id = u.owner_id 
            AND u.organization_id IS NOT NULL
            AND cattle.organization_id IS NULL
        `);

        await queryRunner.query(`
            UPDATE purchases 
            SET organization_id = u.organization_id 
            FROM users u 
            WHERE purchases.owner_id = u.owner_id 
            AND u.organization_id IS NOT NULL
            AND purchases.organization_id IS NULL
        `);

        await queryRunner.query(`
            UPDATE herd_books 
            SET organization_id = u.organization_id 
            FROM users u 
            WHERE herd_books.owner_id = u.owner_id 
            AND u.organization_id IS NOT NULL
            AND herd_books.organization_id IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys and indexes in reverse order
        
        // Suppliers
        await queryRunner.dropForeignKey('suppliers', 'FK_supplier_organization');
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_supplier_organization_id"`);
        await queryRunner.dropColumn('suppliers', 'organization_id');

        // Veterinarians
        await queryRunner.dropForeignKey('veterinarians', 'FK_veterinarian_organization');
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_veterinarian_organization_id"`);
        await queryRunner.dropColumn('veterinarians', 'organization_id');

        // Herd books
        await queryRunner.dropForeignKey('herd_books', 'FK_herd_book_organization');
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_herd_book_organization_id"`);
        await queryRunner.dropColumn('herd_books', 'organization_id');

        // Purchases
        await queryRunner.dropForeignKey('purchases', 'FK_purchase_organization');
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchase_organization_id"`);
        await queryRunner.dropColumn('purchases', 'organization_id');

        // Cattle
        await queryRunner.dropForeignKey('cattle', 'FK_cattle_organization');
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cattle_organization_id"`);
        await queryRunner.dropColumn('cattle', 'organization_id');
    }
}
