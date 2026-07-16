import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/modules/platform/users/entities/user.entity';
import { configureApp } from '../src/bootstrap-app';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

describe('Dashboard Endpoints E2E', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let testOwnerId: string;
  let superAdminId: string;
  let ownerAdminId: string;
  let ownerUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);

    // Clean up test data
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query('DELETE FROM treatments');
    await queryRunner.query('DELETE FROM events');
    await queryRunner.query('DELETE FROM cattle');
    await queryRunner.query('DELETE FROM invitations');
    await queryRunner.query('DELETE FROM auth_providers');
    await queryRunner.query('DELETE FROM users');
    await queryRunner.query('DELETE FROM owners');
    await queryRunner.release();

    // Create test owner
    testOwnerId = randomUUID();
    await queryRunner.query(
      `INSERT INTO owners (id, name, email, phone, address, city, country, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [testOwnerId, 'Test Owner', 'test-owner@example.com', '+1234567890', '123 Test Street', 'Test City', 'Test Country']
    );

    // Create test users with hashed passwords
    const hashedPassword = await bcrypt.hash('password123', 10);
    superAdminId = randomUUID();
    ownerAdminId = randomUUID();
    ownerUserId = randomUUID();

    await queryRunner.query(
      `INSERT INTO users (id, name, email, role, is_active, hashed_password, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [superAdminId, 'Super Admin', 'superadmin@example.com', 'SUPER_ADMIN', true, hashedPassword, null]
    );

    await queryRunner.query(
      `INSERT INTO users (id, name, email, role, is_active, hashed_password, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [ownerAdminId, 'Owner Admin', 'owneradmin@example.com', 'OWNER_ADMIN', true, hashedPassword, testOwnerId]
    );

    await queryRunner.query(
      `INSERT INTO users (id, name, email, role, is_active, hashed_password, owner_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [ownerUserId, 'Owner User', 'owneruser@example.com', 'OWNER_USER', true, hashedPassword, testOwnerId]
    );

    // Link users with LOCAL provider
    await queryRunner.query(
      `INSERT INTO auth_providers (id, provider, provider_user_id, password_hash, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [randomUUID(), 'LOCAL', 'superadmin@example.com', hashedPassword, superAdminId]
    );

    await queryRunner.query(
      `INSERT INTO auth_providers (id, provider, provider_user_id, password_hash, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [randomUUID(), 'LOCAL', 'owneradmin@example.com', hashedPassword, ownerAdminId]
    );

    await queryRunner.query(
      `INSERT INTO auth_providers (id, provider, provider_user_id, password_hash, user_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
      [randomUUID(), 'LOCAL', 'owneruser@example.com', hashedPassword, ownerUserId]
    );

    // Create test invitation
    await queryRunner.query(
      `INSERT INTO invitations (id, email, role, owner_id, status, token, expires_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())`,
      [randomUUID(), 'pending@example.com', 'OWNER_USER', testOwnerId, 'PENDING', 'test-token']
    );

    // Create test cattle
    const cattle1Id = randomUUID();
    const cattle2Id = randomUUID();
    await queryRunner.query(
      `INSERT INTO cattle (id, name, gender, owner_id, birth_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())`,
      [cattle1Id, 'Cattle 1', 'M', testOwnerId]
    );

    await queryRunner.query(
      `INSERT INTO cattle (id, name, gender, owner_id, birth_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())`,
      [cattle2Id, 'Cattle 2', 'F', testOwnerId]
    );

    // Create test event
    await queryRunner.query(
      `INSERT INTO events (id, type, date, description, cattle_id, created_at, updated_at)
       VALUES ($1, $2, NOW(), $3, $4, NOW(), NOW())`,
      [randomUUID(), 1, 'Test event 1', cattle1Id]
    );

    // Create test treatment
    await queryRunner.query(
      `INSERT INTO treatments (id, date, description, cattle_id, created_at, updated_at)
       VALUES ($1, NOW(), $2, $3, NOW(), NOW())`,
      [randomUUID(), 'Test treatment 1', cattle1Id]
    );

    await queryRunner.release();
  });

  afterAll(async () => {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query('DELETE FROM treatments');
    await queryRunner.query('DELETE FROM events');
    await queryRunner.query('DELETE FROM cattle');
    await queryRunner.query('DELETE FROM invitations');
    await queryRunner.query('DELETE FROM auth_providers');
    await queryRunner.query('DELETE FROM users');
    await queryRunner.query('DELETE FROM owners');
    await queryRunner.release();
    await app.close();
  });

  async function loginAndGetToken(email: string, password: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    return response.body.access_token;
  }

  describe('GET /dashboard/stats/platform (Platform Stats)', () => {
    it('✓ SUPER_ADMIN should receive platform statistics', async () => {
      const token = await loginAndGetToken('superadmin@example.com', 'password123');

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats/platform')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalOwners');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalPendingInvitations');
      expect(response.body.totalOwners).toBeGreaterThanOrEqual(1);
      expect(response.body.totalUsers).toBeGreaterThanOrEqual(3);
      expect(response.body.totalPendingInvitations).toBeGreaterThanOrEqual(1);
    });

    it('✓ OWNER_ADMIN should receive 403 Forbidden', async () => {
      const token = await loginAndGetToken('owneradmin@example.com', 'password123');

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats/platform')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('✓ OWNER_USER should receive 403 Forbidden', async () => {
      const token = await loginAndGetToken('owneruser@example.com', 'password123');

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats/platform')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('✓ Unauthenticated request should receive 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats/platform')
        .expect(401);
    });
  });

  describe('GET /dashboard/stats (Business Stats)', () => {
    it('✓ OWNER_ADMIN should receive business statistics scoped to their owner', async () => {
      const token = await loginAndGetToken('owneradmin@example.com', 'password123');

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalCattle');
      expect(response.body).toHaveProperty('healthyCattle');
      expect(response.body).toHaveProperty('healthPercentage');
      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('totalTreatments');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalOwners');
      expect(response.body).toHaveProperty('males');
      expect(response.body).toHaveProperty('females');

      // Business stats should only include owner's data
      expect(response.body.totalCattle).toBe(2);
      expect(response.body.totalEvents).toBe(1);
      expect(response.body.totalTreatments).toBe(1);
      expect(response.body.males).toBe(1);
      expect(response.body.females).toBe(1);

      // Platform counters should be 0 for business stats
      expect(response.body.totalUsers).toBe(0);
      expect(response.body.totalOwners).toBe(0);
    });

    it('✓ OWNER_USER should receive business statistics scoped to their owner', async () => {
      const token = await loginAndGetToken('owneruser@example.com', 'password123');

      const response = await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.totalCattle).toBe(2);
      expect(response.body.totalUsers).toBe(0);
      expect(response.body.totalOwners).toBe(0);
    });

    it('✓ SUPER_ADMIN should receive 403 Forbidden', async () => {
      const token = await loginAndGetToken('superadmin@example.com', 'password123');

      await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('✓ Unauthenticated request should receive 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/dashboard/stats')
        .expect(401);
    });
  });
});
