import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/modules/platform/users/entities/user.entity';
import { Owner } from '../src/modules/platform/owners/entities/owner.entity';
import { configureApp } from '../src/bootstrap-app';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';

describe('Purchases & Suppliers RBAC (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let superAdminToken: string;
    let ownerAdminToken: string;
    let ownerUserToken: string;
    let testOwnerId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configureApp(app);
        app.use(cookieParser());
        await app.init();

        dataSource = app.get(DataSource);
        const userRepo = dataSource.getRepository(User);
        const ownerRepo = dataSource.getRepository(Owner);
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();

        const hashedPassword = await bcrypt.hash('password123', 10);
        const uniqueSuffix = Date.now();

        // Create test owner
        const owner = ownerRepo.create({
            id: randomUUID(),
            name: `Test Owner ${uniqueSuffix}`,
            contactInfo: `contact${uniqueSuffix}@example.com`,
            address: '123 Test Street',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await ownerRepo.save(owner);
        testOwnerId = owner.id;

        const createTestUser = async (email: string, role: UserRole) => {
            const user = userRepo.create({
                id: randomUUID(),
                name: `User ${email}`,
                email,
                hashedPassword,
                role,
                ownerId: role === UserRole.SUPER_ADMIN ? null : testOwnerId,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await userRepo.save(user);
            await queryRunner.query(
                `INSERT INTO auth_providers (id, provider, provider_user_id, password_hash, user_id, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
                [randomUUID(), 'LOCAL', email, hashedPassword, user.id]
            );
            return user;
        };

        const superAdminEmail = `superadmin_${uniqueSuffix}@example.com`;
        const ownerAdminEmail = `owneradmin_${uniqueSuffix}@example.com`;
        const ownerUserEmail = `owneruser_${uniqueSuffix}@example.com`;

        await createTestUser(superAdminEmail, UserRole.SUPER_ADMIN);
        await createTestUser(ownerAdminEmail, UserRole.OWNER_ADMIN);
        await createTestUser(ownerUserEmail, UserRole.OWNER_USER);

        await queryRunner.release();

        const loginAndGetBearer = async (email: string) => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({ email, password: 'password123' });

            return res.body.access_token as string;
        };

        superAdminToken = await loginAndGetBearer(superAdminEmail);
        ownerAdminToken = await loginAndGetBearer(ownerAdminEmail);
        ownerUserToken = await loginAndGetBearer(ownerUserEmail);
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Purchases endpoints', () => {
        it('✓ SUPER_ADMIN should get 403 on GET /purchases', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/purchases')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(403);
        });

        it('✓ OWNER_USER should get 403 on GET /purchases', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/purchases')
                .set('Authorization', `Bearer ${ownerUserToken}`);

            expect(res.status).toBe(403);
        });

        it('✓ OWNER_ADMIN should get 200 on GET /purchases', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/purchases')
                .set('Authorization', `Bearer ${ownerAdminToken}`);

            expect(res.status).toBe(200);
        });

        it('✓ SUPER_ADMIN should get 403 on POST /purchases', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/purchases')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    purchaseDate: '2023-01-01',
                    ownerId: testOwnerId,
                    items: [],
                });

            expect(res.status).toBe(403);
        });

        it('✓ OWNER_USER should get 403 on POST /purchases', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/purchases')
                .set('Authorization', `Bearer ${ownerUserToken}`)
                .send({
                    purchaseDate: '2023-01-01',
                    ownerId: testOwnerId,
                    items: [],
                });

            expect(res.status).toBe(403);
        });

        it('✓ OWNER_ADMIN should get 201 on POST /purchases', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/purchases')
                .set('Authorization', `Bearer ${ownerAdminToken}`)
                .send({
                    purchaseDate: '2023-01-01',
                    ownerId: testOwnerId,
                    items: [],
                });

            expect(res.status).toBe(201);
        });
    });

    describe('Suppliers endpoints', () => {
        it('✓ SUPER_ADMIN should get 403 on GET /suppliers', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/suppliers')
                .set('Authorization', `Bearer ${superAdminToken}`);

            expect(res.status).toBe(403);
        });

        it('✓ OWNER_USER should get 403 on GET /suppliers', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/suppliers')
                .set('Authorization', `Bearer ${ownerUserToken}`);

            expect(res.status).toBe(403);
        });

        it('✓ OWNER_ADMIN should get 200 on GET /suppliers', async () => {
            const res = await request(app.getHttpServer())
                .get('/api/v1/suppliers')
                .set('Authorization', `Bearer ${ownerAdminToken}`);

            expect(res.status).toBe(200);
        });

        it('✓ SUPER_ADMIN should get 403 on POST /suppliers', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/suppliers')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    name: 'Test Supplier',
                    contactInfo: 'test@example.com',
                });

            expect(res.status).toBe(403);
        });

        it('✓ OWNER_USER should get 403 on POST /suppliers', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/suppliers')
                .set('Authorization', `Bearer ${ownerUserToken}`)
                .send({
                    name: 'Test Supplier',
                    contactInfo: 'test@example.com',
                });

            expect(res.status).toBe(403);
        });

        it('✓ OWNER_ADMIN should get 201 on POST /suppliers', async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/suppliers')
                .set('Authorization', `Bearer ${ownerAdminToken}`)
                .send({
                    name: 'Test Supplier',
                    contactInfo: 'test@example.com',
                });

            expect(res.status).toBe(201);
        });
    });
});
