import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAuthAuditLogsTable1784035097372 implements MigrationInterface {
    name = 'CreateAuthAuditLogsTable1784035097372'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."auth_audit_logs_event_type_enum" AS ENUM('LOGIN_SUCCESS', 'LOGIN_FAILED', 'GOOGLE_LOGIN_SUCCESS', 'GOOGLE_LOGIN_FAILED', 'REFRESH_SUCCESS', 'REFRESH_FAILED', 'LOGOUT', 'SESSION_REVOKED', 'ALL_SESSIONS_REVOKED', 'REPLAY_ATTACK', 'CSRF_FAILURE', 'ACCOUNT_DISABLED', 'UNAUTHORIZED_ACCESS')`);
        await queryRunner.query(`CREATE TABLE "auth_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying, "email" character varying NOT NULL, "event_type" "public"."auth_audit_logs_event_type_enum" NOT NULL, "ip_address" character varying, "user_agent" text, "success" boolean NOT NULL, "failure_reason" text, "session_id" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be11d76bd32256469e1a14a97db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fb13cd2514b3c2a7a2b25bf977" ON "auth_audit_logs" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_680cbf7f19e615ce2a8cde23f7" ON "auth_audit_logs" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_af3c28504a86e9fb4023c4d5b5" ON "auth_audit_logs" ("event_type") `);
        await queryRunner.query(`CREATE INDEX "IDX_c1704db47d180a59c893f9aeac" ON "auth_audit_logs" ("ip_address") `);
        await queryRunner.query(`CREATE INDEX "IDX_7a6a51aad3747b48338eaeaa00" ON "auth_audit_logs" ("session_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8bde1474c0336484d13e403602" ON "auth_audit_logs" ("created_at") `);
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
        await queryRunner.query(`DROP INDEX "public"."IDX_8bde1474c0336484d13e403602"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7a6a51aad3747b48338eaeaa00"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c1704db47d180a59c893f9aeac"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af3c28504a86e9fb4023c4d5b5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_680cbf7f19e615ce2a8cde23f7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fb13cd2514b3c2a7a2b25bf977"`);
        await queryRunner.query(`DROP TABLE "auth_audit_logs"`);
        await queryRunner.query(`DROP TYPE "public"."auth_audit_logs_event_type_enum"`);
    }

}
