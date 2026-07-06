import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddAuthProvidersAndInvitations1699272000000 implements MigrationInterface {
    name = 'AddAuthProvidersAndInvitations1699272000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Créer la table auth_providers
        await queryRunner.createTable(
            new Table({
                name: 'auth_providers',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'user_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'provider',
                        type: 'enum',
                        enum: ['LOCAL', 'GOOGLE', 'MICROSOFT', 'APPLE', 'FACEBOOK'],
                        isNullable: false,
                    },
                    {
                        name: 'provider_user_id',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'password_hash',
                        type: 'varchar',
                        length: '255',
                        isNullable: true,
                    },
                    {
                        name: 'last_login_at',
                        type: 'timestamp',
                        isNullable: true,
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
            }),
            true,
        );

        // Créer la foreign key vers users
        await queryRunner.createForeignKey(
            'auth_providers',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'users',
                onDelete: 'CASCADE',
            }),
        );

        // Créer l'index unique sur (provider, provider_user_id)
        await queryRunner.createIndex(
            'auth_providers',
            new TableIndex({
                name: 'IDX_auth_providers_provider_provider_user_id',
                columnNames: ['provider', 'provider_user_id'],
                isUnique: true,
            }),
        );

        // Créer la table invitations
        await queryRunner.createTable(
            new Table({
                name: 'invitations',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'email',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'role',
                        type: 'enum',
                        enum: ['SUPER_ADMIN', 'OWNER_ADMIN', 'OWNER_USER'],
                        isNullable: false,
                    },
                    {
                        name: 'owner_id',
                        type: 'uuid',
                        isNullable: true,
                    },
                    {
                        name: 'token',
                        type: 'varchar',
                        length: '255',
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'used_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        // Modifier la table users pour rendre hashed_password nullable
        await queryRunner.query(`
            ALTER TABLE users 
            ALTER COLUMN hashed_password DROP NOT NULL
        `);

        // Migrer les données existantes : créer un AuthProvider LOCAL pour chaque User
        await queryRunner.query(`
            INSERT INTO auth_providers (user_id, provider, password_hash, created_at, updated_at)
            SELECT id, 'LOCAL', hashed_password, created_at, updated_at
            FROM users
            WHERE hashed_password IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Supprimer l'index unique
        await queryRunner.dropIndex('auth_providers', 'IDX_auth_providers_provider_provider_user_id');

        // Supprimer la foreign key
        await queryRunner.dropForeignKey('auth_providers', 'user_id');

        // Supprimer la table auth_providers
        await queryRunner.dropTable('auth_providers');

        // Supprimer la table invitations
        await queryRunner.dropTable('invitations');

        // Remettre hashed_password comme NOT NULL
        await queryRunner.query(`
            ALTER TABLE users 
            ALTER COLUMN hashed_password SET NOT NULL
        `);
    }
}
