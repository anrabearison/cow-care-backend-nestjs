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

describe('Auth Sessions (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;

    const testPassword = 'Password123!';
    const uniqueSuffix = Date.now();
    const userAEmail = `sessions_e2e_A_${uniqueSuffix}@example.com`;
    const userBEmail = `sessions_e2e_B_${uniqueSuffix}@example.com`;

    // Cookies par appareil
    let deviceA1RefreshCookie: string;
    let deviceA1AccessCookie: string;
    let deviceA2RefreshCookie: string;
    let deviceA2AccessCookie: string;
    let deviceBRefreshCookie: string;
    let deviceBAccessCookie: string;

    // Session IDs
    let sessionA1Id: string;
    let sessionA2Id: string;
    let sessionBId: string;

    const extractCookie = (headers: Record<string, unknown>, name: string): string | undefined => {
        const setCookie = headers['set-cookie'] as string[] | string | undefined;
        if (!setCookie) return undefined;
        const list = Array.isArray(setCookie) ? setCookie : [setCookie];
        const found = list.find((c) => c.startsWith(`${name}=`));
        return found ? found.split(';')[0] : undefined;
    };

    const seedUser = async (email: string, name: string) => {
        const userRepo = dataSource.getRepository(User);
        const hashedPassword = await bcrypt.hash(testPassword, 10);
        const user = userRepo.create({
            id: randomUUID(),
            name,
            email,
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
            [randomUUID(), 'LOCAL', email, hashedPassword, user.id],
        );
        await queryRunner.release();
        return user;
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configureApp(app);
        app.use(cookieParser());
        await app.init();

        dataSource = app.get(DataSource);

        // Seed users
        await seedUser(userAEmail, 'User A');
        await seedUser(userBEmail, 'User B');
    });

    afterAll(async () => {
        if (dataSource) {
            for (const email of [userAEmail, userBEmail]) {
                const users = await dataSource.query(`SELECT id FROM users WHERE email = $1`, [email]);
                if (users.length > 0) {
                    const uid = users[0].id;
                    await dataSource.query(`DELETE FROM refresh_sessions WHERE user_id = $1`, [uid]);
                    await dataSource.query(`DELETE FROM auth_providers WHERE user_id = $1`, [uid]);
                    await dataSource.query(`DELETE FROM users WHERE id = $1`, [uid]);
                }
            }
        }
        await app.close();
    });

    it('✓ Cas 1: Connexion Appareil A1 -> GET /sessions -> 1 session (isCurrentSession=true)', async () => {
        const loginRes = await request(app.getHttpServer())
            .post('/api/v1/platform/auth/login')
            .set('user-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120.0')
            .send({ email: userAEmail, password: testPassword })
            .expect(201);

        deviceA1AccessCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'access_token')!;
        deviceA1RefreshCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'refresh_token')!;
        expect(deviceA1AccessCookie).toBeDefined();
        expect(deviceA1RefreshCookie).toBeDefined();

        const sessionsRes = await request(app.getHttpServer())
            .get('/api/v1/platform/auth/sessions')
            .set('Cookie', [deviceA1AccessCookie, deviceA1RefreshCookie])
            .expect(200);

        const sessions = sessionsRes.body;
        expect(sessions).toHaveLength(1);
        expect(sessions[0].isCurrentSession).toBe(true);

        sessionA1Id = sessions[0].id;
    });

    it('✓ Cas 2: Connexion Appareil A2 -> GET /sessions -> 2 sessions', async () => {
        const loginRes = await request(app.getHttpServer())
            .post('/api/v1/platform/auth/login')
            .set('user-agent', 'Mozilla/5.0 (Linux; Android 13) Mobile Safari/537.36')
            .send({ email: userAEmail, password: testPassword })
            .expect(201);

        deviceA2AccessCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'access_token')!;
        deviceA2RefreshCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'refresh_token')!;
        expect(deviceA2AccessCookie).toBeDefined();
        expect(deviceA2RefreshCookie).toBeDefined();

        // GET /sessions avec tokenA1 -> 2 sessions
        const sessionsRes = await request(app.getHttpServer())
            .get('/api/v1/platform/auth/sessions')
            .set('Cookie', [deviceA1AccessCookie, deviceA1RefreshCookie])
            .expect(200);

        const sessions = sessionsRes.body;
        expect(sessions).toHaveLength(2);

        const currentSession = sessions.find((s: any) => s.isCurrentSession === true);
        const otherSession = sessions.find((s: any) => s.isCurrentSession === false);
        expect(currentSession).toBeDefined();
        expect(otherSession).toBeDefined();

        sessionA2Id = otherSession.id;
    });

    it('✓ Cas 3: DELETE session A2 -> refresh A2 -> 401, refresh A1 -> 204', async () => {
        // Supprimer la session A2 depuis A1
        await request(app.getHttpServer())
            .delete(`/api/v1/platform/auth/sessions/${sessionA2Id}`)
            .set('Cookie', [deviceA1AccessCookie, deviceA1RefreshCookie])
            .expect(204);

        // Refresh avec A2 -> 401
        await request(app.getHttpServer())
            .post('/api/v1/platform/auth/refresh')
            .set('Cookie', deviceA2RefreshCookie)
            .expect(401);

        // Refresh avec A1 -> 204
        const refreshRes = await request(app.getHttpServer())
            .post('/api/v1/platform/auth/refresh')
            .set('Cookie', deviceA1RefreshCookie)
            .expect(204);

        // Update cookies after rotation
        deviceA1AccessCookie = extractCookie(refreshRes.headers as Record<string, unknown>, 'access_token')!;
        deviceA1RefreshCookie = extractCookie(refreshRes.headers as Record<string, unknown>, 'refresh_token')!;
    });

    it('✓ Cas 4: DELETE toutes les autres sessions -> session courante OK, ancienne -> 401', async () => {
        // Re-connexion pour créer une nouvelle session
        const loginRes = await request(app.getHttpServer())
            .post('/api/v1/platform/auth/login')
            .set('user-agent', 'Mozilla/5.0 (Windows NT 10.0) Edge/120.0')
            .send({ email: userAEmail, password: testPassword })
            .expect(201);

        const deviceA3AccessCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'access_token')!;
        const deviceA3RefreshCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'refresh_token')!;

        // DELETE toutes les autres sessions depuis A1
        await request(app.getHttpServer())
            .delete('/api/v1/platform/auth/sessions')
            .set('Cookie', [deviceA1AccessCookie, deviceA1RefreshCookie])
            .expect(204);

        // Refresh A3 -> 401
        await request(app.getHttpServer())
            .post('/api/v1/platform/auth/refresh')
            .set('Cookie', deviceA3RefreshCookie)
            .expect(401);

        // Refresh A1 -> 204
        const refreshRes = await request(app.getHttpServer())
            .post('/api/v1/platform/auth/refresh')
            .set('Cookie', deviceA1RefreshCookie)
            .expect(204);

        deviceA1AccessCookie = extractCookie(refreshRes.headers as Record<string, unknown>, 'access_token')!;
        deviceA1RefreshCookie = extractCookie(refreshRes.headers as Record<string, unknown>, 'refresh_token')!;
    });

    it('✓ Cas 5: Tentative de supprimer une session d\'un autre utilisateur -> 403', async () => {
        // Connexion User B
        const loginBRes = await request(app.getHttpServer())
            .post('/api/v1/platform/auth/login')
            .send({ email: userBEmail, password: testPassword })
            .expect(201);

        deviceBAccessCookie = extractCookie(loginBRes.headers as Record<string, unknown>, 'access_token')!;
        deviceBRefreshCookie = extractCookie(loginBRes.headers as Record<string, unknown>, 'refresh_token')!;

        // Récupérer l'id de session de B
        const sessionsRes = await request(app.getHttpServer())
            .get('/api/v1/platform/auth/sessions')
            .set('Cookie', [deviceBAccessCookie, deviceBRefreshCookie])
            .expect(200);

        sessionBId = sessionsRes.body[0].id;

        // A1 tente de supprimer la session de B -> 403
        await request(app.getHttpServer())
            .delete(`/api/v1/platform/auth/sessions/${sessionBId}`)
            .set('Cookie', [deviceA1AccessCookie, deviceA1RefreshCookie])
            .expect(403);
    });

    it('✓ Cas 6: Suppression de sa propre session -> cookies supprimés -> GET /me sans cookies -> 401', async () => {
        // B supprime sa propre session
        const deleteRes = await request(app.getHttpServer())
            .delete(`/api/v1/platform/auth/sessions/${sessionBId}`)
            .set('Cookie', [deviceBAccessCookie, deviceBRefreshCookie])
            .expect(204);

        // Vérifier que les cookies sont supprimés
        const setCookies = deleteRes.headers['set-cookie'] as unknown as string[];
        expect(setCookies).toBeDefined();
        expect(setCookies.some((c: string) => c.includes('access_token=;') || c.includes('Max-Age=0'))).toBeTruthy();

        // GET /me sans cookies -> 401
        await request(app.getHttpServer())
            .get('/api/v1/auth/me')
            .expect(401);
    });
});
