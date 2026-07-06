import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRoleDefaultValue1783370219986 implements MigrationInterface {
    name = 'RemoveRoleDefaultValue1783370219986'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth_providers" DROP CONSTRAINT "FK_262996fd08ab5a69e85b53d0055"`);
        await queryRunner.query(`ALTER TABLE "cattle_photos" DROP CONSTRAINT "FK_cattle_photos_cattle"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_auth_providers_provider_provider_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cattle_photos_cattle_id"`);
        await queryRunner.query(`ALTER TABLE "auth_providers" ALTER COLUMN "user_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_gender_enum" RENAME TO "cattle_gender_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_gender_enum" AS ENUM('M', 'F')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "gender" TYPE "public"."cattle_gender_enum" USING "gender"::"text"::"public"."cattle_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_gender_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_source_type_enum" RENAME TO "cattle_source_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_source_type_enum" AS ENUM('ACHETE', 'NE_DANS_TROUPEAU')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "source_type" TYPE "public"."cattle_source_type_enum" USING "source_type"::"text"::"public"."cattle_source_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_source_type_enum_old"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_23ce9b23329d07057ec8ece6f2" ON "auth_providers" ("provider", "provider_user_id") `);
        await queryRunner.query(`ALTER TABLE "auth_providers" ADD CONSTRAINT "FK_262996fd08ab5a69e85b53d0055" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cattle_photos" ADD CONSTRAINT "FK_18f7b8b713d2c7b069e3308035c" FOREIGN KEY ("cattle_id") REFERENCES "cattle"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cattle_photos" DROP CONSTRAINT "FK_18f7b8b713d2c7b069e3308035c"`);
        await queryRunner.query(`ALTER TABLE "auth_providers" DROP CONSTRAINT "FK_262996fd08ab5a69e85b53d0055"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_23ce9b23329d07057ec8ece6f2"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_source_type_enum_old" AS ENUM('ACHETE', 'NE_DANS_TROUPEAU')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "source_type" TYPE "public"."cattle_source_type_enum_old" USING "source_type"::"text"::"public"."cattle_source_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_source_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_source_type_enum_old" RENAME TO "cattle_source_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_gender_enum_old" AS ENUM('M', 'F')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "gender" TYPE "public"."cattle_gender_enum_old" USING "gender"::"text"::"public"."cattle_gender_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_gender_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_gender_enum_old" RENAME TO "cattle_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'OWNER_USER'`);
        await queryRunner.query(`ALTER TABLE "auth_providers" ALTER COLUMN "user_id" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_cattle_photos_cattle_id" ON "cattle_photos" ("cattle_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_auth_providers_provider_provider_user_id" ON "auth_providers" ("provider", "provider_user_id") `);
        await queryRunner.query(`ALTER TABLE "cattle_photos" ADD CONSTRAINT "FK_cattle_photos_cattle" FOREIGN KEY ("cattle_id") REFERENCES "cattle"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auth_providers" ADD CONSTRAINT "FK_262996fd08ab5a69e85b53d0055" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
