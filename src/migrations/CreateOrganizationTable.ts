import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from 'typeorm';

export class CreateOrganizationTable1234567890123 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create organizations table
        await queryRunner.createTable(
            new Table({
                name: 'organizations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'name',
                        type: 'varchar',
                        length: '255',
                    },
                    {
                        name: 'code',
                        type: 'varchar',
                        length: '50',
                        isUnique: true,
                    },
                    {
                        name: 'description',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'is_active',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
                indices: [
                    {
                        name: 'IDX_organization_code',
                        columnNames: ['code'],
                    },
                ],
            }),
            true,
        );

        // Add organization_id column to users table
        await queryRunner.addColumn(
            'users',
            new TableColumn({
                name: 'organization_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        // Create index on organization_id in users table
        await queryRunner.query(
            `CREATE INDEX "IDX_user_organization_id" ON "users" ("organization_id")`,
        );

        // Create foreign key constraint
        await queryRunner.createForeignKey(
            'users',
            new TableForeignKey({
                name: 'FK_user_organization',
                columnNames: ['organization_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'organizations',
                onDelete: 'SET NULL',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key
        await queryRunner.dropForeignKey('users', 'FK_user_organization');

        // Drop index on organization_id in users table
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_user_organization_id"`,
        );

        // Drop organization_id column from users table
        await queryRunner.dropColumn('users', 'organization_id');

        // Drop organizations table
        await queryRunner.dropTable('organizations');
    }
}
