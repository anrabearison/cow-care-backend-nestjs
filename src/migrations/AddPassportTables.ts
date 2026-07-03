import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPassportTables1714765200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums first (PostgreSQL doesn't support IF NOT EXISTS for types, so we check manually)
    const locationTypeExists = await queryRunner.query(`
      SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'location_type');
    `);
    if (!locationTypeExists[0].exists) {
      await queryRunner.query(`
        CREATE TYPE "location_type" AS ENUM ('REGION', 'DISTRICT', 'COMMUNE', 'FOKONTANY');
      `);
    }

    const passportStatusExists = await queryRunner.query(`
      SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'passport_status');
    `);
    if (!passportStatusExists[0].exists) {
      await queryRunner.query(`
        CREATE TYPE "passport_status" AS ENUM ('DRAFT', 'GENERATED', 'USED', 'CANCELLED');
      `);
    }

    const auditActionExists = await queryRunner.query(`
      SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'audit_action');
    `);
    if (!auditActionExists[0].exists) {
      await queryRunner.query(`
        CREATE TYPE "audit_action" AS ENUM ('CREATED', 'UPDATED', 'GENERATED', 'CANCELLED', 'USED', 'STATUS_CHANGED');
      `);
    }

    // Create location table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "location" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "type" "location_type" NOT NULL,
        "code" varchar(20),
        "parent_id" uuid,
        "region_id" uuid,
        "district_id" uuid,
        "commune_id" uuid,
        "active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for location
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_location_type" ON "location" ("type");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_location_code" ON "location" ("code");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_location_parent" ON "location" ("parent_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_location_region" ON "location" ("region_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_location_district" ON "location" ("district_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_location_commune" ON "location" ("commune_id");`);

    // Create applicant table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "applicant" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(200) NOT NULL,
        "cin_number" varchar(50) UNIQUE NOT NULL,
        "cin_issue_date" date NOT NULL,
        "cin_issue_location" varchar(100) NOT NULL,
        "residence_commune_id" uuid,
        "fokontany_id" uuid,
        "commune_id" uuid,
        "district_id" uuid,
        "region_id" uuid,
        "residence_commune" varchar(100),
        "fokontany_legacy" varchar(100),
        "commune_legacy" varchar(100),
        "district_legacy" varchar(100),
        "region_legacy" varchar(100),
        "active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
        "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for applicant
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_applicant_name" ON "applicant" ("name");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_applicant_cin" ON "applicant" ("cin_number");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_applicant_residence_commune" ON "applicant" ("residence_commune_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_applicant_fokontany" ON "applicant" ("fokontany_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_applicant_commune" ON "applicant" ("commune_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_applicant_district" ON "applicant" ("district_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_applicant_region" ON "applicant" ("region_id");`);

    // Create passport_cattle_snapshot table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "passport_cattle_snapshot" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "passport_id" uuid NOT NULL,
        "herd_book_cattle_id" uuid NOT NULL,
        "n_carnet" varchar(50) NOT NULL,
        "character_name" varchar(200) NOT NULL,
        "name" varchar(100) NOT NULL,
        "brand" varchar(200),
        "quantity" int DEFAULT 1,
        "snapshot_date" timestamp NOT NULL,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for passport_cattle_snapshot
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_snapshot_passport" ON "passport_cattle_snapshot" ("passport_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_snapshot_herd_book_cattle" ON "passport_cattle_snapshot" ("herd_book_cattle_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_snapshot_date" ON "passport_cattle_snapshot" ("snapshot_date");`);

    // Create passport_audit table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "passport_audit" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "passport_id" uuid NOT NULL,
        "action" "audit_action" NOT NULL,
        "previous_status" "passport_status",
        "new_status" "passport_status",
        "user_id" uuid,
        "ip_address" varchar(50),
        "user_agent" text,
        "metadata" json,
        "reason" text,
        "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create indexes for passport_audit
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_passport" ON "passport_audit" ("passport_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_action" ON "passport_audit" ("action");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_user" ON "passport_audit" ("user_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_audit_created_at" ON "passport_audit" ("created_at");`);

    // Create herd_book_cattle_passport table
    const hbcpTableExists = await queryRunner.query(`
      SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'herd_book_cattle_passport');
    `);
    
    if (!hbcpTableExists[0].exists) {
      await queryRunner.query(`
        CREATE TABLE "herd_book_cattle_passport" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "passport_id" uuid NOT NULL,
          "herd_book_cattle_id" uuid NOT NULL,
          "snapshot_id" uuid,
          "created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
          "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      // Check if snapshot_id column exists
      const columnExists = await queryRunner.query(`
        SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'herd_book_cattle_passport' AND column_name = 'snapshot_id');
      `);
      if (!columnExists[0].exists) {
        await queryRunner.query(`ALTER TABLE "herd_book_cattle_passport" ADD COLUMN "snapshot_id" uuid;`);
      }
    }

    // Create indexes for herd_book_cattle_passport
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hbcp_passport" ON "herd_book_cattle_passport" ("passport_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hbcp_herd_book_cattle" ON "herd_book_cattle_passport" ("herd_book_cattle_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_hbcp_snapshot" ON "herd_book_cattle_passport" ("snapshot_id");`);

    // Add new columns to passport table
    await queryRunner.query(`
      ALTER TABLE "passport" 
      ADD COLUMN IF NOT EXISTS "applicant_id" uuid,
      ADD COLUMN IF NOT EXISTS "applicant_name" varchar(200),
      ADD COLUMN IF NOT EXISTS "cin_number" varchar(50),
      ADD COLUMN IF NOT EXISTS "cin_issue_date" date,
      ADD COLUMN IF NOT EXISTS "cin_issue_location" varchar(100),
      ADD COLUMN IF NOT EXISTS "residence_commune_id" uuid,
      ADD COLUMN IF NOT EXISTS "fokontany_id" uuid,
      ADD COLUMN IF NOT EXISTS "commune_id" uuid,
      ADD COLUMN IF NOT EXISTS "residence_district_id" uuid,
      ADD COLUMN IF NOT EXISTS "region_id" uuid,
      ADD COLUMN IF NOT EXISTS "residence_commune" varchar(100),
      ADD COLUMN IF NOT EXISTS "fokontany_legacy" varchar(100),
      ADD COLUMN IF NOT EXISTS "commune_legacy" varchar(100),
      ADD COLUMN IF NOT EXISTS "residence_district_legacy" varchar(100),
      ADD COLUMN IF NOT EXISTS "region_legacy" varchar(100);
    `);

    // Create indexes for passport new columns
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_passport_applicant" ON "passport" ("applicant_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_passport_residence_commune" ON "passport" ("residence_commune_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_passport_fokontany" ON "passport" ("fokontany_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_passport_commune" ON "passport" ("commune_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_passport_residence_district" ON "passport" ("residence_district_id");`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_passport_region" ON "passport" ("region_id");`);

    // Alter passport status column to use enum (only if it's not already using passport_status)
    const statusColumnType = await queryRunner.query(`
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'passport' AND column_name = 'status';
    `);
    
    if (statusColumnType.length > 0 && statusColumnType[0].data_type !== 'USER-DEFINED') {
      await queryRunner.query(`
        ALTER TABLE "passport" 
        ALTER COLUMN "status" TYPE "passport_status" USING "status"::"passport_status";
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop passport indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_passport_region";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_passport_residence_district";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_passport_commune";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_passport_fokontany";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_passport_residence_commune";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_passport_applicant";`);

    // Drop passport new columns
    await queryRunner.query(`
      ALTER TABLE "passport" 
      DROP COLUMN IF EXISTS "region_legacy",
      DROP COLUMN IF EXISTS "residence_district_legacy",
      DROP COLUMN IF EXISTS "commune_legacy",
      DROP COLUMN IF EXISTS "fokontany_legacy",
      DROP COLUMN IF EXISTS "residence_commune",
      DROP COLUMN IF EXISTS "region_id",
      DROP COLUMN IF EXISTS "residence_district_id",
      DROP COLUMN IF EXISTS "commune_id",
      DROP COLUMN IF EXISTS "fokontany_id",
      DROP COLUMN IF EXISTS "residence_commune_id",
      DROP COLUMN IF EXISTS "cin_issue_location",
      DROP COLUMN IF EXISTS "cin_issue_date",
      DROP COLUMN IF EXISTS "cin_number",
      DROP COLUMN IF EXISTS "applicant_name",
      DROP COLUMN IF EXISTS "applicant_id";
    `);

    // Drop herd_book_cattle_passport table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_hbcp_snapshot";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_hbcp_herd_book_cattle";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_hbcp_passport";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "herd_book_cattle_passport";`);

    // Drop passport_audit table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_created_at";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_user";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_action";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_audit_passport";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "passport_audit";`);

    // Drop passport_cattle_snapshot table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_snapshot_date";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_snapshot_herd_book_cattle";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_snapshot_passport";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "passport_cattle_snapshot";`);

    // Drop applicant table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_applicant_region";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_applicant_district";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_applicant_commune";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_applicant_fokontany";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_applicant_residence_commune";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_applicant_cin";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_applicant_name";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "applicant";`);

    // Drop location table
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_commune";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_district";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_region";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_parent";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_code";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_location_type";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "location";`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS "audit_action";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "passport_status";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "location_type";`);
  }
}
