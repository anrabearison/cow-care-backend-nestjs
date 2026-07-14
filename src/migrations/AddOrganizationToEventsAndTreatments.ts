import { MigrationInterface, QueryRunner, TableForeignKey, TableIndex } from 'typeorm';

export class AddOrganizationToEventsAndTreatments1736870000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // ─── Events table ──────────────────────────────────────────────────────────────
        
        // Add organization_id column to events
        await queryRunner.query(`
            ALTER TABLE events 
            ADD COLUMN organization_id uuid NULL
        `);

        // Add index on organization_id
        await queryRunner.createIndex('events', new TableIndex({
            name: 'IDX_events_organization_id',
            columnNames: ['organization_id'],
        }));

        // Add foreign key constraint
        await queryRunner.createForeignKey('events', new TableForeignKey({
            name: 'FK_events_organization',
            columnNames: ['organization_id'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
        }));

        // Migrate existing events data - set organization_id from cattle's organization
        await queryRunner.query(`
            UPDATE events e
            SET organization_id = c.organization_id
            FROM cattle c
            WHERE e.cattle_id = c.id
        `);

        // ─── Treatments table ────────────────────────────────────────────────────────────
        
        // Add organization_id column to treatments
        await queryRunner.query(`
            ALTER TABLE treatments 
            ADD COLUMN organization_id uuid NULL
        `);

        // Add index on organization_id
        await queryRunner.createIndex('treatments', new TableIndex({
            name: 'IDX_treatments_organization_id',
            columnNames: ['organization_id'],
        }));

        // Add foreign key constraint
        await queryRunner.createForeignKey('treatments', new TableForeignKey({
            name: 'FK_treatments_organization',
            columnNames: ['organization_id'],
            referencedTableName: 'organizations',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
        }));

        // Migrate existing treatments data - set organization_id from cattle's organization
        await queryRunner.query(`
            UPDATE treatments t
            SET organization_id = c.organization_id
            FROM cattle c
            WHERE t.cattle_id = c.id
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // ─── Events table ──────────────────────────────────────────────────────────────
        
        // Drop foreign key
        await queryRunner.dropForeignKey('events', 'FK_events_organization');
        
        // Drop index
        await queryRunner.dropIndex('events', 'IDX_events_organization_id');
        
        // Drop column
        await queryRunner.query(`
            ALTER TABLE events 
            DROP COLUMN organization_id
        `);

        // ─── Treatments table ────────────────────────────────────────────────────────────
        
        // Drop foreign key
        await queryRunner.dropForeignKey('treatments', 'FK_treatments_organization');
        
        // Drop index
        await queryRunner.dropIndex('treatments', 'IDX_treatments_organization_id');
        
        // Drop column
        await queryRunner.query(`
            ALTER TABLE treatments 
            DROP COLUMN organization_id
        `);
    }
}
