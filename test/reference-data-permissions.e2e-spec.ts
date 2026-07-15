import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { configureApp } from '../src/bootstrap-app';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';

describe('Reference Data Permissions (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let superAdminToken: string;
    let ownerToken: string;
    let testMedicamentId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configureApp(app);
        app.use(cookieParser());

        await app.init();

        dataSource = app.get(DataSource);

        // Clean up test data
        await cleanTestData();

        // Create SUPER_ADMIN user
        const superAdmin = await createTestUser(UserRole.SUPER_ADMIN);
        superAdminToken = await loginAndGetToken(superAdmin.email, 'password123');

        // Create OWNER user
        const owner = await createTestUser(UserRole.OWNER_USER);
        ownerToken = await loginAndGetToken(owner.email, 'password123');
    });

    afterAll(async () => {
        await cleanTestData();
        await app.close();
    });

    async function cleanTestData() {
        const userRepo = dataSource.getRepository(User);
        const users = await userRepo.find({ where: { email: /test-ref-permissions/ } as any });
        await userRepo.remove(users);
    }

    async function createTestUser(role: UserRole): Promise<User> {
        const userRepo = dataSource.getRepository(User);
        const uniqueSuffix = Date.now();
        const email = `test-ref-permissions-${role}-${uniqueSuffix}@example.com`;
        
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = userRepo.create({
            id: randomUUID(),
            name: `Test ${role} ${uniqueSuffix}`,
            email,
            hashedPassword,
            role,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        return await userRepo.save(user);
    }

    async function loginAndGetToken(email: string, password: string): Promise<string> {
        const response = await request(app.getHttpServer())
            .post('/api/v1/platform/auth/login')
            .send({ email, password })
            .expect(201);

        return response.body.access_token;
    }

    describe('Medicaments - Platform Reference Data', () => {
        it('SUPER_ADMIN should be able to create medicament', async () => {
            const medData = {
                name: 'Test Permission Medicament',
                type: 'Antibiotic',
                dosageQuantity: 10,
                dosageUnit: 'ML',
                dosageWeight: 100,
                dosageWeightUnit: 'KG',
                dosageNotes: 'Daily',
                withdrawalPeriodMeat: 0,
                withdrawalPeriodMilk: 0,
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/platform/reference-data/medicaments')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send(medData)
                .expect(201);

            expect(response.body.id).toBeDefined();
            testMedicamentId = response.body.id;
        });

        it('OWNER should NOT be able to create medicament', async () => {
            const medData = {
                name: 'Owner Test Medicament',
                type: 'Antibiotic',
                dosageQuantity: 10,
                dosageUnit: 'ML',
            };

            await request(app.getHttpServer())
                .post('/api/v1/platform/reference-data/medicaments')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(medData)
                .expect(403);
        });

        it('SUPER_ADMIN should be able to update medicament', async () => {
            const updateData = {
                name: 'Updated Test Medicament',
            };

            await request(app.getHttpServer())
                .put(`/api/v1/platform/reference-data/medicaments/${testMedicamentId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send(updateData)
                .expect(200);
        });

        it('OWNER should NOT be able to update medicament', async () => {
            const updateData = {
                name: 'Owner Updated Medicament',
            };

            await request(app.getHttpServer())
                .put(`/api/v1/platform/reference-data/medicaments/${testMedicamentId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(updateData)
                .expect(403);
        });

        it('SUPER_ADMIN should be able to delete medicament', async () => {
            await request(app.getHttpServer())
                .delete(`/api/v1/platform/reference-data/medicaments/${testMedicamentId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);
        });

        it('OWNER should NOT be able to delete medicament', async () => {
            await request(app.getHttpServer())
                .delete(`/api/v1/platform/reference-data/medicaments/${testMedicamentId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(403);
        });
    });

    describe('Categories - Platform Reference Data', () => {
        let testCategoryId: string;

        it('SUPER_ADMIN should be able to create category', async () => {
            const categoryData = {
                name: 'Test Permission Category',
                description: 'Test description',
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/platform/reference-data/categories')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send(categoryData)
                .expect(201);

            expect(response.body.id).toBeDefined();
            testCategoryId = response.body.id;
        });

        it('OWNER should NOT be able to create category', async () => {
            const categoryData = {
                name: 'Owner Test Category',
            };

            await request(app.getHttpServer())
                .post('/api/v1/platform/reference-data/categories')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(categoryData)
                .expect(403);
        });

        it('SUPER_ADMIN should be able to update category', async () => {
            const updateData = {
                name: 'Updated Test Category',
            };

            await request(app.getHttpServer())
                .put(`/api/v1/platform/reference-data/categories/${testCategoryId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send(updateData)
                .expect(200);
        });

        it('OWNER should NOT be able to update category', async () => {
            const updateData = {
                name: 'Owner Updated Category',
            };

            await request(app.getHttpServer())
                .put(`/api/v1/platform/reference-data/categories/${testCategoryId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .send(updateData)
                .expect(403);
        });

        it('SUPER_ADMIN should be able to delete category', async () => {
            await request(app.getHttpServer())
                .delete(`/api/v1/platform/reference-data/categories/${testCategoryId}`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);
        });

        it('OWNER should NOT be able to delete category', async () => {
            await request(app.getHttpServer())
                .delete(`/api/v1/platform/reference-data/categories/${testCategoryId}`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(403);
        });
    });

    describe('Read Access - Both roles can read', () => {
        it('SUPER_ADMIN should be able to list medicaments', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/platform/reference-data/medicaments')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);
        });

        it('OWNER should be able to list medicaments', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/platform/reference-data/medicaments')
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);
        });

        it('SUPER_ADMIN should be able to list categories', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/platform/reference-data/categories')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);
        });

        it('OWNER should be able to list categories', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/platform/reference-data/categories')
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);
        });
    });
});
