import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap-app';
import cookieParser from 'cookie-parser';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/platform/users/entities/user.entity';
import { AuthProvider } from '../src/modules/auth/entities/auth-provider.entity';

describe('Auth Refresh (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let refreshTokenCookie: string;
    let accessTokenCookie: string;
    const testPassword = 'Password123!';
    const uniqueSuffix = Date.now();
    const testEmail = `refresh_e2e_${uniqueSuffix}@example.com`;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configureApp(app);
        app.use(cookieParser());
        await app.init();

        dataSource = app.get(DataSource);

        // Seed test user via register endpoint (creates User + AuthProvider LOCAL automatically)
        await request(app.getHttpServer())
            .post('/api/v1/auth/register')
            .send({
                name: 'Refresh E2E User',
                email: testEmail,
                password: testPassword,
            })
            .expect(201);
    });

    afterAll(async () => {
        if (dataSource) {
            const userRepo = dataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { email: testEmail } });
            if (user) {
                const authProviderRepo = dataSource.getRepository(AuthProvider);
                await authProviderRepo.delete({ user: { id: user.id } });
                await dataSource.query("DELETE FROM auth_providers WHERE user_id = $1", [user.id]); await userRepo.remove(user);
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

    it('✓ Login -> Cookie HttpOnly access_token + refresh_token emis', async () => {
        const loginRes = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email: testEmail, password: testPassword })
            .expect(201);

        accessTokenCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'access_token');
        refreshTokenCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'refresh_token');

        expect(accessTokenCookie).toBeDefined();
        expect(refreshTokenCookie).toBeDefined();

        // Refresh token must NOT appear in body
        expect(loginRes.body.refresh_token).toBeUndefined();
    });

    it('✓ POST /auth/refresh -> 204 No Content, nouveaux cookies', async () => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .set('Cookie', refreshTokenCookie)
            .expect(204);

        expect(res.body).toEqual({});

        const newAccessCookie = extractCookie(res.headers as Record<string, unknown>, 'access_token');
        const newRefreshCookie = extractCookie(res.headers as Record<string, unknown>, 'refresh_token');

        expect(newAccessCookie).toBeDefined();
        expect(newRefreshCookie).toBeDefined();
        expect(newRefreshCookie).not.toEqual(refreshTokenCookie);

        const oldRefreshCookie = refreshTokenCookie;
        accessTokenCookie = newAccessCookie;
        refreshTokenCookie = newRefreshCookie;

        // ✓ GET /auth/me fonctionne avec le nouveau access token
        await request(app.getHttpServer())
            .get('/api/v1/auth/me')
            .set('Cookie', accessTokenCookie)
            .expect(200);

        // ✓ REPLAY ATTACK : réutilisation de l'ancien refresh token -> 401
        await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .set('Cookie', oldRefreshCookie)
            .expect(401);

        // ✓ Session révoquée -> le nouveau token est aussi invalide
        await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .set('Cookie', refreshTokenCookie)
            .expect(401);
    });

    it('✓ POST /auth/refresh sans cookie -> 401', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .expect(401);
    });

    it('✓ POST /auth/refresh cookie invalide -> 401', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/auth/refresh')
            .set('Cookie', 'refresh_token=invalid.jwt.token')
            .expect(401);
    });
});
