import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOwnerSoftDelete1784330018659 implements MigrationInterface {
    name = 'AddOwnerSoftDelete1784330018659'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_suppliers_owner_id"`);
        await queryRunner.query(`ALTER TABLE "owners" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_gender_enum" RENAME TO "cattle_gender_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_gender_enum" AS ENUM('M', 'F')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "gender" TYPE "public"."cattle_gender_enum" USING "gender"::"text"::"public"."cattle_gender_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_gender_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_source_type_enum" RENAME TO "cattle_source_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_source_type_enum" AS ENUM('ACHETE', 'NE_DANS_TROUPEAU')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "source_type" TYPE "public"."cattle_source_type_enum" USING "source_type"::"text"::"public"."cattle_source_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_source_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_55c112a3befcd9f69f984bf7811" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "suppliers" DROP CONSTRAINT "FK_55c112a3befcd9f69f984bf7811"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_source_type_enum_old" AS ENUM('ACHETE', 'NE_DANS_TROUPEAU')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "source_type" TYPE "public"."cattle_source_type_enum_old" USING "source_type"::"text"::"public"."cattle_source_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_source_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_source_type_enum_old" RENAME TO "cattle_source_type_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."cattle_gender_enum_old" AS ENUM('M', 'F')`);
        await queryRunner.query(`ALTER TABLE "cattle" ALTER COLUMN "gender" TYPE "public"."cattle_gender_enum_old" USING "gender"::"text"::"public"."cattle_gender_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."cattle_gender_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."cattle_gender_enum_old" RENAME TO "cattle_gender_enum"`);
        await queryRunner.query(`ALTER TABLE "owners" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "suppliers" ADD CONSTRAINT "FK_suppliers_owner_id" FOREIGN KEY ("owner_id") REFERENCES "owners"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
