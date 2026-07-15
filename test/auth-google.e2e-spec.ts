import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { User, UserRole } from '../src/modules/platform/users/entities/user.entity';
import { configureApp } from '../src/bootstrap-app';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { GoogleOAuthService } from '../src/modules/auth/services/google-oauth.service';
import { AuthProviderService } from '../src/modules/auth/services/auth-provider.service';

describe('Auth Google OAuth (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let configService: ConfigService;
    let googleOAuthService: GoogleOAuthService;
    let authProviderService: AuthProviderService;
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
        googleOAuthService = app.get(GoogleOAuthService);
        authProviderService = app.get(AuthProviderService);

        // Seed a test user
        const uniqueSuffix = Date.now();
        testUserEmail = `google-user${uniqueSuffix}@example.com`;
        testUserId = randomUUID();
        
        const userRepo = dataSource.getRepository(User);
        const user = userRepo.create({
            id: testUserId,
            name: `Google User ${uniqueSuffix}`,
            email: testUserEmail,
            role: UserRole.OWNER_USER,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await userRepo.save(user);

        // Link with GOOGLE provider
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.query(
            `INSERT INTO auth_providers (id, provider, provider_user_id, user_id, created_at, updated_at, last_login_at)
             VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())`,
            [randomUUID(), 'GOOGLE', `google-sub-${uniqueSuffix}`, testUserId]
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

    // Mock Google OAuth service to avoid real Google API calls
    beforeEach(() => {
        jest.spyOn(googleOAuthService, 'exchangeCodeForTokens').mockResolvedValue({
            access_token: 'mock-google-access-token',
            id_token: 'mock-google-id-token',
            expires_in: 3600,
            token_type: 'Bearer',
        });

        jest.spyOn(googleOAuthService, 'verifyIdToken').mockResolvedValue({
            email: testUserEmail,
            sub: `google-sub-${Date.now()}`,
            emailVerified: true,
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Cas 1: Google Login → Set-Cookie → GET /auth/me → 200', () => {
        it('POST /auth/google - Crée les cookies HttpOnly et permet l\'accès à /auth/me', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/google')
                .send({
                    code: 'mock-google-code',
                    state: null,
                })
                .expect(200);

            // 1. Vérifier la présence du JWT dans le corps (compatibilité temporaire)
            expect(response.body.access_token).toBeDefined();
            expect(typeof response.body.access_token).toBe('string');
            expect(response.body.token_type).toBe('Bearer');
            expect(response.body.user).toBeDefined();
            expect(response.body.user.email).toBe(testUserEmail);

            // 2. Vérifier la présence du Set-Cookie access_token
            const setCookieHeader = response.header['set-cookie'];
            expect(setCookieHeader).toBeDefined();
            expect(Array.isArray(setCookieHeader)).toBe(true);

            const cookieConfig = configService.get('authCookies');
            const accessTokenName = cookieConfig.accessTokenName || 'access_token';
            const refreshTokenName = cookieConfig.refreshTokenName || 'refresh_token';

            const parsedAccessCookie = parseCookie(setCookieHeader, accessTokenName);
            expect(parsedAccessCookie).not.toBeNull();
            expect(parsedAccessCookie.value).toBe(response.body.access_token);
            expect(parsedAccessCookie.attrs['httponly']).toBe(true);

            const parsedRefreshCookie = parseCookie(setCookieHeader, refreshTokenName);
            expect(parsedRefreshCookie).not.toBeNull();
            expect(parsedRefreshCookie.attrs['httponly']).toBe(true);

            // 3. Vérifier que GET /auth/me fonctionne avec les cookies
            const agent = request.agent(app.getHttpServer());
            const meResponse = await agent
                .get('/api/v1/auth/me')
                .expect(200);

            expect(meResponse.body.email).toBe(testUserEmail);
        });
    });

    describe('Cas 2: Google Login → POST /refresh → 204', () => {
        it('POST /auth/google → POST /refresh - Renouvelle les tokens via cookies', async () => {
            const agent = request.agent(app.getHttpServer());

            // 1. Google Login
            const loginResponse = await agent
                .post('/api/v1/auth/google')
                .send({
                    code: 'mock-google-code',
                    state: null,
                })
                .expect(200);

            const initialAccessToken = loginResponse.body.access_token;

            // 2. Refresh tokens
            const refreshResponse = await agent
                .post('/api/v1/auth/refresh')
                .expect(204);

            // 3. Vérifier que les nouveaux cookies sont définis via Set-Cookie header
            const setCookieHeader = refreshResponse.header['set-cookie'];
            expect(setCookieHeader).toBeDefined();
            expect(Array.isArray(setCookieHeader)).toBe(true);

            // 4. Vérifier que GET /auth/me fonctionne toujours
            const meResponse = await agent
                .get('/api/v1/auth/me')
                .expect(200);

            expect(meResponse.body.email).toBe(testUserEmail);
        });
    });

    describe('Cas 3: Google Login → POST /logout → 204 → GET /me → 401', () => {
        it('POST /auth/google → POST /logout - Invalide la session', async () => {
            const agent = request.agent(app.getHttpServer());

            // 1. Google Login
            await agent
                .post('/api/v1/auth/google')
                .send({
                    code: 'mock-google-code',
                    state: null,
                })
                .expect(200);

            // 2. Logout
            await agent
                .post('/api/v1/auth/logout')
                .expect(204);

            // 3. Vérifier que GET /auth/me retourne 401
            await agent
                .get('/api/v1/auth/me')
                .expect(401);
        });
    });

    describe('Cas 4: Google Login → DELETE sessions → fonctionnel', () => {
        it('POST /auth/google → DELETE /auth/sessions - Gestion des sessions', async () => {
            const agent = request.agent(app.getHttpServer());

            // 1. Google Login
            await agent
                .post('/api/v1/auth/google')
                .send({
                    code: 'mock-google-code',
                    state: null,
                })
                .expect(200);

            // 2. Lister les sessions
            const sessionsResponse = await agent
                .get('/api/v1/auth/sessions')
                .expect(200);

            expect(Array.isArray(sessionsResponse.body)).toBe(true);
            expect(sessionsResponse.body.length).toBeGreaterThan(0);

            const sessionId = sessionsResponse.body[0].id;

            // 3. Supprimer la session courante
            await agent
                .delete(`/api/v1/auth/sessions/${sessionId}`)
                .expect(204);

            // 4. Vérifier que GET /auth/me retourne 401
            await agent
                .get('/api/v1/auth/me')
                .expect(401);
        });

        it('POST /auth/google → DELETE /auth/sessions (toutes sauf courante) - Fonctionnel', async () => {
            const agent = request.agent(app.getHttpServer());

            // 1. Google Login
            await agent
                .post('/api/v1/auth/google')
                .send({
                    code: 'mock-google-code',
                    state: null,
                })
                .expect(200);

            // 2. Lister les sessions
            const sessionsResponse = await agent
                .get('/api/v1/auth/sessions')
                .expect(200);

            expect(Array.isArray(sessionsResponse.body)).toBe(true);

            // 3. Supprimer toutes les autres sessions
            await agent
                .delete('/api/v1/auth/sessions')
                .expect(204);

            // 4. Vérifier que la session courante est toujours valide
            await agent
                .get('/api/v1/auth/me')
                .expect(200);
        });
    });
});
