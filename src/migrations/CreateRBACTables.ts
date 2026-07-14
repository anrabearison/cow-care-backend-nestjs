import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateRBACTables1699999999999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'domain',
            type: 'enum',
            enum: ['PLATFORM', 'FARM'],
          },
          {
            name: 'active',
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
      }),
      true,
    );

    // Create index on permissions.code
    await queryRunner.createIndex(
      'permissions',
      new TableIndex({
        name: 'idx_permissions_code',
        columnNames: ['code'],
      }),
    );

    // Create index on permissions.domain
    await queryRunner.createIndex(
      'permissions',
      new TableIndex({
        name: 'idx_permissions_domain',
        columnNames: ['domain'],
      }),
    );

    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'code',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'domain',
            type: 'enum',
            enum: ['PLATFORM', 'FARM'],
          },
          {
            name: 'active',
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
      }),
      true,
    );

    // Create index on roles.code
    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'idx_roles_code',
        columnNames: ['code'],
      }),
    );

    // Create index on roles.domain
    await queryRunner.createIndex(
      'roles',
      new TableIndex({
        name: 'idx_roles_domain',
        columnNames: ['domain'],
      }),
    );

    // Create role_permissions table
    await queryRunner.createTable(
      new Table({
        name: 'role_permissions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'role_id',
            type: 'uuid',
          },
          {
            name: 'permission_id',
            type: 'uuid',
          },
        ],
      }),
      true,
    );

    // Create foreign key for role_permissions.role_id
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key for role_permissions.permission_id
    await queryRunner.createForeignKey(
      'role_permissions',
      new TableForeignKey({
        columnNames: ['permission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'permissions',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique index on role_permissions (role_id, permission_id)
    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'idx_role_permissions_unique',
        columnNames: ['role_id', 'permission_id'],
        isUnique: true,
      }),
    );

    // Create index on role_permissions.role_id
    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'idx_role_permissions_role_id',
        columnNames: ['role_id'],
      }),
    );

    // Create index on role_permissions.permission_id
    await queryRunner.createIndex(
      'role_permissions',
      new TableIndex({
        name: 'idx_role_permissions_permission_id',
        columnNames: ['permission_id'],
      }),
    );

    // Create user_roles table
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
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
          },
          {
            name: 'role_id',
            type: 'uuid',
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

    // Create foreign key for user_roles.role_id
    await queryRunner.createForeignKey(
      'user_roles',
      new TableForeignKey({
        columnNames: ['role_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'roles',
        onDelete: 'CASCADE',
      }),
    );

    // Create unique index on user_roles (user_id, role_id)
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'idx_user_roles_unique',
        columnNames: ['user_id', 'role_id'],
        isUnique: true,
      }),
    );

    // Create index on user_roles.user_id
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'idx_user_roles_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create index on user_roles.role_id
    await queryRunner.createIndex(
      'user_roles',
      new TableIndex({
        name: 'idx_user_roles_role_id',
        columnNames: ['role_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop user_roles table
    await queryRunner.dropTable('user_roles');

    // Drop role_permissions table
    await queryRunner.dropTable('role_permissions');

    // Drop roles table
    await queryRunner.dropTable('roles');

    // Drop permissions table
    await queryRunner.dropTable('permissions');
  }
}
