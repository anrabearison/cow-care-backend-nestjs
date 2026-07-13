import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap-app';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/modules/users/entities/user.entity';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

describe('Auth Logout (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    
    let deviceARefreshCookie: string;
    let deviceAAccessCookie: string;
    
    let deviceBRefreshCookie: string;
    let deviceBAccessCookie: string;
    
    const testPassword = 'Password123!';
    const uniqueSuffix = Date.now();
    const testEmail = `logout_e2e_${uniqueSuffix}@example.com`;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configureApp(app);
        app.use(cookieParser());
        await app.init();

        dataSource = app.get(DataSource);

        // Seed test user directly via TypeORM
        const userRepo = dataSource.getRepository(User);
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const user = userRepo.create({
            id: randomUUID(),
            name: 'Logout E2E User',
            email: testEmail,
            hashedPassword,
            role: UserRole.OWNER_USER,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await userRepo.save(user);

        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.query(
            `INSERT INTO auth_providers (id, provider, provider_user_id, password_hash, user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [randomUUID(), 'LOCAL', testEmail, hashedPassword, user.id],
        );
        await queryRunner.release();
    });

    afterAll(async () => {
        if (dataSource) {
            const users = await dataSource.query(`SELECT id FROM users WHERE email = $1`, [testEmail]);
            if (users.length > 0) {
                const uid = users[0].id;
                await dataSource.query(`DELETE FROM refresh_sessions WHERE user_id = $1`, [uid]);
                await dataSource.query(`DELETE FROM auth_providers WHERE user_id = $1`, [uid]);
                await dataSource.query(`DELETE FROM users WHERE id = $1`, [uid]);
            }
        }
        await app.close();
    });

    const extractCookie = (headers: Record<string, unknown>, name: string): string | undefined => {
        const setCookie = headers['set-cookie'] as string[] | string | undefined;
        if (!setCookie) return undefined;
        const list = Array.isArray(setCookie) ? setCookie : [setCookie];
        const found = list.find((c) => c.startsWith(`${name}=`));
        return found ? found.split(';')[0] : undefined;
    };

    it('✓ Connexion Appareil A', async () => {
        const loginRes = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email: testEmail, password: testPassword })
            .expect(201);

        deviceAAccessCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'access_token')!;
        deviceARefreshCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'refresh_token')!;

        expect(deviceAAccessCookie).toBeDefined();
        expect(deviceARefreshCookie).toBeDefined();
    });

    it('✓ Connexion Appareil B', async () => {
        const loginRes = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email: testEmail, password: testPassword })
            .expect(201);

        deviceBAccessCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'access_token')!;
        deviceBRefreshCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'refresh_token')!;

        expect(deviceBAccessCookie).toBeDefined();
        expect(deviceBRefreshCookie).toBeDefined();
        expect(deviceBRefreshCookie).not.toEqual(deviceARefreshCookie);
    });

    it('✓ POST /auth/logout sur Appareil A -> 204 No Content et effacement cookies', async () => {
        const logoutRes = await request(app.getHttpServer())
            .post('/api/v1/auth/logout')
            .set('Cookie', deviceARefreshCookie)
            .expect(204);

        expect(logoutRes.body).toEqual({});

        const newAccessCookie = extractCookie(logoutRes.headers as Record<string, unknown>, 'access_token');
        const newRefreshCookie = extractCookie(logoutRes.headers as Record<string, unknown>, 'refresh_token');

        // Verify that cookies are being cleared (typically they will be set with maxAge=0, 
        // meaning they will still be in the response but empty or with expire date in the past)
        const setCookies = logoutRes.headers['set-cookie'] as unknown as string[];
        expect(setCookies).toBeDefined();
        expect(setCookies.some(c => c.includes('access_token=;') || c.includes('Max-Age=0'))).toBeTruthy();
        expect(setCookies.some(c => c.includes('refresh_token=;') || c.includes('Max-Age=0'))).toBeTruthy();
    });

    it('✓ Appareil A: POST /auth/refresh -> 401 Unauthorized (session révoquée)', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .set('Cookie', deviceARefreshCookie)
            .expect(401);
    });

    it('✓ Appareil B: POST /auth/refresh -> 204 No Content (session toujours active)', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .set('Cookie', deviceBRefreshCookie)
            .expect(204);
            
        deviceBRefreshCookie = extractCookie(res.headers as Record<string, unknown>, 'refresh_token')!;
        expect(deviceBRefreshCookie).toBeDefined();
    });

    it('✓ Double appel POST /auth/logout sur Appareil A -> 204 (Idempotence)', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/auth/logout')
            .set('Cookie', deviceARefreshCookie)
            .expect(204);
    });
});
