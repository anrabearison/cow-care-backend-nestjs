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
import { ConfigService } from '@nestjs/config';

describe('Auth CSRF Protection (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let configService: ConfigService;
    let testUserEmail: string;
    let testUserId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configureApp(app);
        app.use(cookieParser());

        await app.init();

        dataSource = app.get(DataSource);
        configService = app.get(ConfigService);

        // Seed a test user
        const uniqueSuffix = Date.now();
        testUserEmail = `csrf-user${uniqueSuffix}@example.com`;
        testUserId = randomUUID();
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const userRepo = dataSource.getRepository(User);
        const user = userRepo.create({
            id: testUserId,
            name: `CSRF Test User ${uniqueSuffix}`,
            email: testUserEmail,
            hashedPassword,
            role: UserRole.OWNER_USER,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await userRepo.save(user);

        // Link with LOCAL provider
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.query(
            `INSERT INTO auth_providers (id, provider, provider_user_id, password_hash, user_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
            [randomUUID(), 'LOCAL', testUserEmail, hashedPassword, user.id]
        );
        await queryRunner.release();
    });

    afterAll(async () => {
        // Clean up user
        if (testUserId) {
            const userRepo = dataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { id: testUserId } });
            if (user) {
                const queryRunner = dataSource.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.query('DELETE FROM refresh_sessions WHERE user_id = $1', [user.id]);
                await queryRunner.query('DELETE FROM auth_providers WHERE user_id = $1', [user.id]);
                await queryRunner.release();
                await userRepo.remove(user);
            }
        }
        await app.close();
    });

    function parseCookie(cookieHeader: string | string[] | undefined, name: string) {
        if (!cookieHeader) return null;
        const list = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
        const cookieStr = list.find(c => c.startsWith(`${name}=`));
        if (!cookieStr) return null;

        const parts = cookieStr.split(';').map(p => p.trim());
        const [nameValue, ...attributes] = parts;
        const value = nameValue.substring(name.length + 1);

        const attrs: Record<string, string | boolean> = {};
        for (const attr of attributes) {
            const [k, v] = attr.split('=');
            const key = k.toLowerCase();
            attrs[key] = v !== undefined ? v : true;
        }

        return { value, attrs };
    }

    describe('Cas 1: Login → 3 cookies (access_token, refresh_token, csrf_token)', () => {
        it('POST /auth/login - Crée les trois cookies', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            const setCookieHeader = response.header['set-cookie'];
            expect(setCookieHeader).toBeDefined();
            expect(Array.isArray(setCookieHeader)).toBe(true);

            const cookieConfig = configService.get('authCookies');
            const accessTokenName = cookieConfig.accessTokenName || 'access_token';
            const refreshTokenName = cookieConfig.refreshTokenName || 'refresh_token';
            const csrfTokenName = cookieConfig.csrfTokenName || 'csrf_token';

            const parsedAccessCookie = parseCookie(setCookieHeader, accessTokenName);
            expect(parsedAccessCookie).not.toBeNull();
            expect(parsedAccessCookie.attrs['httponly']).toBe(true);

            const parsedRefreshCookie = parseCookie(setCookieHeader, refreshTokenName);
            expect(parsedRefreshCookie).not.toBeNull();
            expect(parsedRefreshCookie.attrs['httponly']).toBe(true);

            const parsedCsrfCookie = parseCookie(setCookieHeader, csrfTokenName);
            expect(parsedCsrfCookie).not.toBeNull();
            expect(parsedCsrfCookie.attrs['httponly']).toBe(false); // CSRF cookie is NOT HttpOnly
        });
    });

    describe('Cas 2: POST protégé avec cookie + header → 200', () => {
        it('POST /auth/logout avec CSRF valide → 204', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            const loginResponse = await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            const setCookieHeader = loginResponse.header['set-cookie'];
            const cookieConfig = configService.get('authCookies');
            const csrfTokenName = cookieConfig.csrfTokenName || 'csrf_token';

            const parsedCsrfCookie = parseCookie(setCookieHeader, csrfTokenName);
            const csrfToken = parsedCsrfCookie.value;

            // Logout with CSRF header
            await agent
                .post('/api/v1/auth/logout')
                .set('X-CSRF-Token', csrfToken)
                .expect(204);
        });

        it('POST /cattle avec CSRF valide → 201', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            const loginResponse = await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            const setCookieHeader = loginResponse.header['set-cookie'];
            const cookieConfig = configService.get('authCookies');
            const csrfTokenName = cookieConfig.csrfTokenName || 'csrf_token';

            const parsedCsrfCookie = parseCookie(setCookieHeader, csrfTokenName);
            const csrfToken = parsedCsrfCookie.value;

            // Create cattle with CSRF header
            await agent
                .post('/api/v1/cattle')
                .set('X-CSRF-Token', csrfToken)
                .send({
                    herdBookId: 'TEST-001',
                    name: 'Test Cow',
                    sex: 'FEMALE',
                    birthDate: new Date().toISOString(),
                })
                .expect(201);
        });
    });

    describe('Cas 3: POST sans header → 403', () => {
        it('POST /auth/logout sans CSRF header → 403', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            // Logout without CSRF header
            await agent
                .post('/api/v1/auth/logout')
                .expect(403);
        });

        it('POST /cattle sans CSRF header → 403', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            // Create cattle without CSRF header
            await agent
                .post('/api/v1/cattle')
                .send({
                    herdBookId: 'TEST-002',
                    name: 'Test Cow 2',
                    sex: 'FEMALE',
                    birthDate: new Date().toISOString(),
                })
                .expect(403);
        });
    });

    describe('Cas 4: POST avec mauvais token → 403', () => {
        it('POST /auth/logout avec mauvais CSRF token → 403', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            // Logout with wrong CSRF token
            await agent
                .post('/api/v1/auth/logout')
                .set('X-CSRF-Token', 'wrong-csrf-token')
                .expect(403);
        });

        it('POST /cattle avec mauvais CSRF token → 403', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            // Create cattle with wrong CSRF token
            await agent
                .post('/api/v1/cattle')
                .set('X-CSRF-Token', 'wrong-csrf-token')
                .send({
                    herdBookId: 'TEST-003',
                    name: 'Test Cow 3',
                    sex: 'FEMALE',
                    birthDate: new Date().toISOString(),
                })
                .expect(403);
        });
    });

    describe('Cas 5: Refresh → nouveau csrf cookie', () => {
        it('POST /auth/refresh génère un nouveau CSRF token', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            const loginResponse = await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            const loginSetCookie = loginResponse.header['set-cookie'];
            const cookieConfig = configService.get('authCookies');
            const csrfTokenName = cookieConfig.csrfTokenName || 'csrf_token';

            const loginCsrfCookie = parseCookie(loginSetCookie, csrfTokenName);
            const loginCsrfToken = loginCsrfCookie.value;

            // Refresh tokens
            const refreshResponse = await agent
                .post('/api/v1/auth/refresh')
                .set('X-CSRF-Token', loginCsrfToken)
                .expect(204);

            const refreshSetCookie = refreshResponse.header['set-cookie'];
            const refreshCsrfCookie = parseCookie(refreshSetCookie, csrfTokenName);
            const refreshCsrfToken = refreshCsrfCookie.value;

            // CSRF token should be different after refresh
            expect(refreshCsrfToken).toBeDefined();
            expect(refreshCsrfToken).not.toBe(loginCsrfToken);
        });
    });

    describe('Cas 6: Logout → suppression des trois cookies', () => {
        it('POST /auth/logout supprime access_token, refresh_token et csrf_token', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            const loginResponse = await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            const loginSetCookie = loginResponse.header['set-cookie'];
            const cookieConfig = configService.get('authCookies');
            const accessTokenName = cookieConfig.accessTokenName || 'access_token';
            const refreshTokenName = cookieConfig.refreshTokenName || 'refresh_token';
            const csrfTokenName = cookieConfig.csrfTokenName || 'csrf_token';

            const loginCsrfCookie = parseCookie(loginSetCookie, csrfTokenName);
            const loginCsrfToken = loginCsrfCookie.value;

            // Logout with CSRF header
            const logoutResponse = await agent
                .post('/api/v1/auth/logout')
                .set('X-CSRF-Token', loginCsrfToken)
                .expect(204);

            const logoutSetCookie = logoutResponse.header['set-cookie'];
            expect(logoutSetCookie).toBeDefined();

            // Check that all three cookies are cleared (maxAge=0)
            const clearedAccessCookie = parseCookie(logoutSetCookie, accessTokenName);
            expect(clearedAccessCookie.attrs['maxage']).toBe(0);

            const clearedRefreshCookie = parseCookie(logoutSetCookie, refreshTokenName);
            expect(clearedRefreshCookie.attrs['maxage']).toBe(0);

            const clearedCsrfCookie = parseCookie(logoutSetCookie, csrfTokenName);
            expect(clearedCsrfCookie.attrs['maxage']).toBe(0);
        });
    });

    describe('Cas 7: GET requests exempted from CSRF', () => {
        it('GET /auth/me fonctionne sans CSRF header', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            // GET request without CSRF header should work
            await agent
                .get('/api/v1/auth/me')
                .expect(200);
        });

        it('GET /cattle fonctionne sans CSRF header', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login to get cookies
            await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            // GET request without CSRF header should work
            await agent
                .get('/api/v1/cattle')
                .expect(200);
        });
    });
});
