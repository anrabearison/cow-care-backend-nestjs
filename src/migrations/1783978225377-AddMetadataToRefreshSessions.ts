import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMetadataToRefreshSessions1783978225377 implements MigrationInterface {
    name = 'AddMetadataToRefreshSessions1783978225377'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_refresh_sessions_user_id"`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" ADD "ip_address" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" ADD "user_agent" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" ADD "device_name" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" ADD "browser" character varying`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" ADD "os" character varying`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_gender_enum" RENAME TO "cattle_gender_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_gender_enum" AS ENUM('M', 'F')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "gender" TYPE "public"."cattle_gender_enum" USING "gender"::"text"::"public"."cattle_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_gender_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_source_type_enum" RENAME TO "cattle_source_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_source_type_enum" AS ENUM('ACHETE', 'NE_DANS_TROUPEAU')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "source_type" TYPE "public"."cattle_source_type_enum" USING "source_type"::"text"::"public"."cattle_source_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_source_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."cattle_source_type_enum_old" AS ENUM('ACHETE', 'NE_DANS_TROUPEAU')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "source_type" TYPE "public"."cattle_source_type_enum_old" USING "source_type"::"text"::"public"."cattle_source_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_source_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_source_type_enum_old" RENAME TO "cattle_source_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_gender_enum_old" AS ENUM('M', 'F')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "gender" TYPE "public"."cattle_gender_enum_old" USING "gender"::"text"::"public"."cattle_gender_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_gender_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_gender_enum_old" RENAME TO "cattle_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" DROP COLUMN "os"`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" DROP COLUMN "browser"`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" DROP COLUMN "device_name"`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" DROP COLUMN "user_agent"`);
        await queryRunner.query(`ALTER TABLE "refresh_sessions" DROP COLUMN "ip_address"`);
        await queryRunner.query(`CREATE INDEX "IDX_refresh_sessions_user_id" ON "refresh_sessions" ("user_id") `);
    }

}
