import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerIdToSuppliers1784275804211 implements MigrationInterface {
    name = 'AddOwnerIdToSuppliers1784275804211'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" ADD "owner_id" character varying`);
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
        await queryRunner.query(`ALTER TABLE "suppliers" DROP COLUMN "owner_id"`);
    }

}
