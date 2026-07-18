import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateLocalAuthProviders1784330100000 implements MigrationInterface {
    name = 'MigrateLocalAuthProviders1784330100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.startTransaction();
        try {
            // Step 1: Find all users with hashed_password but no LOCAL AuthProvider
            const usersWithoutLocalProvider = await queryRunner.query(`
                SELECT u.id, u.email, u.hashed_password
                FROM users u
                WHERE u.hashed_password IS NOT NULL
                AND NOT EXISTS (
                    SELECT 1 FROM auth_providers ap
                    WHERE ap.user_id = u.id AND ap.provider = 'LOCAL'
                )
            `);

            console.log(`Found ${usersWithoutLocalProvider.length} users to migrate`);

            // Step 2: For each user, create a LOCAL AuthProvider using the existing hash
            for (const user of usersWithoutLocalProvider) {
                // Check if a LOCAL provider already exists (idempotency check)
                const existingProvider = await queryRunner.query(`
                    SELECT id FROM auth_providers 
                    WHERE user_id = $1 AND provider = 'LOCAL'
                `, [user.id]);

                if (existingProvider.length === 0) {
                    // Create new LOCAL provider with existing hash
                    await queryRunner.query(`
                        INSERT INTO auth_providers (id, provider, provider_user_id, password_hash, user_id, created_at, updated_at)
                        VALUES (gen_random_uuid(), 'LOCAL', $1, $2, $3, NOW(), NOW())
                    `, [user.email, user.hashed_password, user.id]);
                    
                    console.log(`Created LOCAL AuthProvider for user: ${user.email}`);
                } else {
                    console.log(`LOCAL AuthProvider already exists for user: ${user.email} (skipping)`);
                }
            }

            console.log('Migration completed successfully');
            await queryRunner.commitTransaction();
        } catch (error) {
            console.error('Migration failed, rolling back', error);
            await queryRunner.rollbackTransaction();
            throw error;
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.startTransaction();
        try {
            // Rollback: Remove LOCAL AuthProviders that were created by this migration
            // We identify them by checking if the user still has hashed_password
            // (since new users created after this migration won't have hashed_password)
            
            const providersToRemove = await queryRunner.query(`
                SELECT ap.id, ap.user_id
                FROM auth_providers ap
                INNER JOIN users u ON u.id = ap.user_id
                WHERE ap.provider = 'LOCAL'
                AND u.hashed_password IS NOT NULL
            `);

            for (const provider of providersToRemove) {
                await queryRunner.query(`
                    DELETE FROM auth_providers WHERE id = $1
                `, [provider.id]);
            }

            console.log(`Rollback completed: removed ${providersToRemove.length} LOCAL AuthProviders`);
            await queryRunner.commitTransaction();
        } catch (error) {
            console.error('Rollback failed', error);
            await queryRunner.rollbackTransaction();
            throw error;
        }
    }
}
