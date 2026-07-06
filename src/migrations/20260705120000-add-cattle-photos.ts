import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCattlePhotos20260705120000 implements MigrationInterface {
    name = 'AddCattlePhotos20260705120000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cattle_photos" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "cattle_id" uuid NOT NULL,
                "url" character varying(500) NOT NULL,
                "public_id" character varying(255),
                "position" integer NOT NULL DEFAULT 0,
                "is_primary" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_cattle_photos_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_cattle_photo_position" UNIQUE ("cattle_id", "position"),
                CONSTRAINT "FK_cattle_photos_cattle" FOREIGN KEY ("cattle_id") REFERENCES "cattle"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_cattle_photos_cattle_id" ON "cattle_photos" ("cattle_id")`);

        await queryRunner.query(`
            INSERT INTO "cattle_photos" ("cattle_id", "url", "position", "is_primary")
            SELECT "id", "photo", 0, true
            FROM "cattle"
            WHERE "photo" IS NOT NULL AND "photo" <> ''
            ON CONFLICT ("cattle_id", "position") DO NOTHING
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_cattle_photos_cattle_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "cattle_photos"`);
    }
}
