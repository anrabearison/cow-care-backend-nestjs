import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/modules/platform/users/entities/user.entity';
import { configureApp } from '../src/bootstrap-app';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

describe('Backoffice CRUD (e2e)', () => {
    let app: INestApplication;
    let superAdminAuthToken: string;
    let ownerAdminAuthToken: string;

    // Shared IDs for sequential tests
    let createdOwnerId: string;
    let createdMedicamentId: string;
    let createdVeterinarianId: string;
    let createdCattleId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configureApp(app);

        await app.init();

        const dataSource = app.get(DataSource);
        const uniqueSuffix = Date.now();
        const userRepo = dataSource.getRepository(User);

        // Create SUPER_ADMIN user
        const superAdminEmail = `superadmin${uniqueSuffix}@example.com`;
        const hashedPassword = await bcrypt.hash('password123', 10);
        const superAdmin = userRepo.create({
            id: randomUUID(),
            name: `Super Admin ${uniqueSuffix}`,
            email: superAdminEmail,
            hashedPassword,
            role: UserRole.SUPER_ADMIN,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await userRepo.save(superAdmin);

        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.query(
            `INSERT INTO auth_providers (id, provider, provider_user_id, password_hash, user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [randomUUID(), 'LOCAL', superAdminEmail, hashedPassword, superAdmin.id]
        );

        // Create OWNER_ADMIN user for animal module tests
        const ownerAdminEmail = `owneradmin${uniqueSuffix}@example.com`;
        const ownerAdmin = userRepo.create({
            id: randomUUID(),
            name: `Owner Admin ${uniqueSuffix}`,
            email: ownerAdminEmail,
            hashedPassword,
            role: UserRole.OWNER_ADMIN,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await userRepo.save(ownerAdmin);

        await queryRunner.query(
            `INSERT INTO auth_providers (id, provider, provider_user_id, password_hash, user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [randomUUID(), 'LOCAL', ownerAdminEmail, hashedPassword, ownerAdmin.id]
        );
        await queryRunner.release();

        // Login as SUPER_ADMIN
        const superAdminLoginResponse = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({
                email: superAdminEmail,
                password: 'password123',
            })
            .expect(201);

        superAdminAuthToken = superAdminLoginResponse.body.access_token;

        // Login as OWNER_ADMIN
        const ownerAdminLoginResponse = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({
                email: ownerAdminEmail,
                password: 'password123',
            })
            .expect(201);

        ownerAdminAuthToken = ownerAdminLoginResponse.body.access_token;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Owners Module', () => {
        it('should create an owner', async () => {
            const ownerData = {
                name: 'Test Owner',
                email: 'test@owner.com',
                address: '123 Farm Lane',
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/owners')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .send(ownerData)
                .expect(201);

            expect(response.body.id).toBeDefined();
            expect(response.body.name).toBe(ownerData.name);
            createdOwnerId = response.body.id;
        });
    });

    describe('Medicaments Module', () => {
        it('should create a medicament', async () => {
            const medData = {
                name: 'Test Medicament',
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
                .post('/api/v1/medicaments')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .send(medData)
                if (response.status !== 201) console.error('Medicament Create Error:', response.body);
                expect(response.status).toBe(201);

            expect(response.body.id).toBeDefined();
            createdMedicamentId = response.body.id;
        });

        it('should list medicaments with filter', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/medicaments?q=Test')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(200);

            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('Veterinarians Module', () => {
        it('should create a veterinarian', async () => {
            const vetData = {
                name: 'Dr. Test',
                specialty: 'General',
                phone: '123456789',
                email: 'vet@test.com',
                address: 'Vet Clinic',
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/veterinarians')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .send(vetData)
                if (response.status !== 201) console.error('Veterinarian Create Error:', response.body);
                expect(response.status).toBe(201);

            expect(response.body.id).toBeDefined();
            createdVeterinarianId = response.body.id;
        });

        it('should list veterinarians', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/veterinarians')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(200);

            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Cattle Module', () => {
        it('should create a cattle', async () => {
            const cattleData = {
                name: 'Bessie',
                nickname: 'Bes',
                gender: 'F',
                birthDate: '2023-01-01',
                ownerId: createdOwnerId,
                source: {
                    type: 'NE_DANS_TROUPEAU',
                    supplier: 'Farm',
                    purchaseDate: '2023-01-01',
                },
            };

            const response = await request(app.getHttpServer())
                .post('/api/v1/cattle')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .send(cattleData)
                if (response.status !== 201) console.error('Cattle Create Error:', response.body);
                expect(response.status).toBe(201);

            expect(response.body.id).toBeDefined();
            expect(response.body.name).toBe(cattleData.name);
            createdCattleId = response.body.id;
        });

        it('should list cattle', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/cattle')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .expect(200);

            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should update cattle (deep update)', async () => {
            const simpleUpdate = { nickname: 'Bessie Updated' };

            const response = await request(app.getHttpServer())
                .put(`/api/v1/cattle/${createdCattleId}`)
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .send(simpleUpdate)
                .expect(200);

            expect(response.body.nickname).toBe(simpleUpdate.nickname);
        });
    });

    describe('Events Module', () => {
        it('should list events', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/events')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .expect(200);

            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });
    describe('Users Module', () => {
        it('should list users', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Categories Module', () => {
        it('should list categories', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/categories')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Characters Module', () => {
        it('should list characters', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/characters')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('EventTypes Module', () => {
        it('should list event-types', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/event-types')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Status Module', () => {
        it('should list status', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/status')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Treatments Module', () => {
        it('should create a treatment', async () => {
            const treatmentData = {
                cattleId: createdCattleId,
                type: 'VACCIN',
                date: '2023-01-01',
                product: createdMedicamentId,
                dosage: {
                    quantity: 10,
                    unit: 'ML'
                },
                veterinarian: createdVeterinarianId
            };
            const response = await request(app.getHttpServer())
                .post('/api/v1/treatments')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .send(treatmentData);
            if (response.status !== 201) console.error('Treatment Create Error:', response.body);
            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
        });

        it('should list treatments', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/treatments')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('HerdBooks Module', () => {
        it('should list herd-books', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/herd-books')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('HerdBookCattle Module', () => {
        it('should list herd-book-cattle', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/herd-book-cattle')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Suppliers Module', () => {
        it('should create a supplier', async () => {
            const suppData = {
                name: 'Test Supplier',
                email: 'supplier@test.com',
                phone: '1234567890',
            };
            const response = await request(app.getHttpServer())
                .post('/api/v1/suppliers')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .send(suppData);
            if (response.status !== 201) console.error('Supplier Create Error:', response.body);
            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
        });

        it('should list suppliers', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/suppliers')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Purchases Module', () => {
        it('should create a purchase', async () => {
            const purchData = {
                purchaseDate: '2023-01-01',
                items: [],
                ownerId: createdOwnerId
            };
            const response = await request(app.getHttpServer())
                .post('/api/v1/purchases')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .send(purchData);
            if (response.status !== 201) console.error('Purchase Create Error:', response.body);
            expect(response.status).toBe(201);
            expect(response.body.id).toBeDefined();
        });

        it('should list purchases', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/purchases')
                .set('Authorization', `Bearer ${ownerAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('SUPER_ADMIN RBAC Restrictions', () => {
        it('SUPER_ADMIN should get 403 on cattle GET', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/cattle')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(403);
        });

        it('SUPER_ADMIN should get 403 on cattle POST', async () => {
            const cattleData = {
                name: 'Test Cattle',
                gender: 'F',
                birthDate: '2023-01-01',
                ownerId: createdOwnerId,
            };
            await request(app.getHttpServer())
                .post('/api/v1/cattle')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .send(cattleData)
                .expect(403);
        });

        it('SUPER_ADMIN should get 403 on events GET', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/events')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(403);
        });

        it('SUPER_ADMIN should get 403 on treatments GET', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/treatments')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(403);
        });

        it('SUPER_ADMIN should get 403 on herd-book-cattle GET', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/herd-book-cattle')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(403);
        });

        it('SUPER_ADMIN should get 403 on passport GET', async () => {
            await request(app.getHttpServer())
                .get('/api/v1/passport')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(403);
        });

        it('SUPER_ADMIN should retain access to medicaments GET', async () => {
            const response = await request(app.getHttpServer())
                .get('/api/v1/medicaments')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .expect(200);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('SUPER_ADMIN should retain access to medicaments POST', async () => {
            const medData = {
                name: 'Test Medicament SUPER_ADMIN',
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
                .post('/api/v1/medicaments')
                .set('Authorization', `Bearer ${superAdminAuthToken}`)
                .send(medData)
                .expect(201);
            expect(response.body.id).toBeDefined();
        });
    });
});
