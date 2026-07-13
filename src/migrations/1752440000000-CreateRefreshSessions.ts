import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRefreshSessions1752440000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'refresh_sessions',
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
                        name: 'refresh_token_hash',
                        type: 'varchar',
                        length: '255',
                        isNullable: false,
                    },
                    {
                        name: 'expires_at',
                        type: 'timestamp',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'last_used_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                    {
                        name: 'revoked_at',
                        type: 'timestamp',
                        isNullable: true,
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'refresh_sessions',
            new TableForeignKey({
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createIndex(
            'refresh_sessions',
            new TableIndex({
                name: 'IDX_refresh_sessions_user_id',
                columnNames: ['user_id'],
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable('refresh_sessions', true, true, true);
    }
}
