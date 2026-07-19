import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap-app';
import { DataSource } from 'typeorm';
import { User, UserRole } from '../src/modules/platform/users/entities/user.entity';
import { AuthProvider } from '../src/modules/auth/entities/auth-provider.entity';
import { AuthProviderType } from '../src/modules/auth/entities/auth-provider.entity';
import cookieParser from 'cookie-parser';
import { UserProvisioningService } from '../src/modules/auth/services/user-provisioning.service';

/** Extracts the raw "name=value" pair from a Set-Cookie header array. */
function extractCookie(headers: Record<string, unknown>, name: string): string | undefined {
    const setCookie = headers['set-cookie'] as string[] | string | undefined;
    if (!setCookie) return undefined;
    const list = Array.isArray(setCookie) ? setCookie : [setCookie];
    const found = list.find((c) => c.startsWith(`${name}=`));
    return found ? found.split(';')[0] : undefined; // e.g. "access_token=<jwt>"
}

/** Extracts just the value part from "name=value". */
function extractCookieValue(headers: Record<string, unknown>, name: string): string | undefined {
    const raw = extractCookie(headers, name);
    if (!raw) return undefined;
    const eqIdx = raw.indexOf('=');
    return eqIdx >= 0 ? raw.slice(eqIdx + 1) : undefined;
}

describe('User Provisioning Integration (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let superAdminEmail: string;

    // Full cookie strings for Cookie: header (e.g. "access_token=<jwt>")
    let superAdminAccessCookie: string;
    let superAdminRefreshCookie: string;
    let superAdminCsrfCookie: string;   // "csrf_token=<value>" for Cookie: header
    // CSRF token value only (for X-CSRF-Token: header)
    let superAdminCsrfToken: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        configureApp(app);
        app.use(cookieParser());
        await app.init();

        dataSource = app.get(DataSource);
        const userProvisioningService = app.get(UserProvisioningService);

        // Create SUPER_ADMIN directly via service (bypasses HTTP, no rate limiting)
        const uniqueSuffix = Date.now();
        superAdminEmail = `superadmin_${uniqueSuffix}@example.com`;

        await userProvisioningService.createUser(
            'Super Admin',
            superAdminEmail,
            'password123',
            { role: UserRole.SUPER_ADMIN, isActive: true },
        );

        // Login to get auth cookies
        const loginRes = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email: superAdminEmail, password: 'password123' })
            .expect(201);

        superAdminAccessCookie  = extractCookie(loginRes.headers as Record<string, unknown>, 'access_token')!;
        superAdminRefreshCookie = extractCookie(loginRes.headers as Record<string, unknown>, 'refresh_token')!;
        superAdminCsrfCookie    = extractCookie(loginRes.headers as Record<string, unknown>, 'csrf_token')!;
        superAdminCsrfToken     = extractCookieValue(loginRes.headers as Record<string, unknown>, 'csrf_token')!;

        expect(superAdminAccessCookie).toBeDefined();
        expect(superAdminCsrfCookie).toBeDefined();
        expect(superAdminCsrfToken).toBeDefined();
    });

    afterAll(async () => {
        if (dataSource) {
            const userRepo = dataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { email: superAdminEmail } });
            if (user) {
                const authProviderRepo = dataSource.getRepository(AuthProvider);
                await authProviderRepo.delete({ user: { id: user.id } });
                await dataSource.query('DELETE FROM refresh_sessions WHERE user_id = $1', [user.id]);
                await userRepo.remove(user);
            }
        }
        await app.close();
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Cas A: Création via /users (endpoint backoffice)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Cas A: Création via /users (backoffice)', () => {
        let createdUserEmail: string;
        let createdUserId: string;

        it('POST /users - Crée un utilisateur avec AuthProvider LOCAL', async () => {
            const uniqueSuffix = Date.now();
            createdUserEmail = `backoffice_user_${uniqueSuffix}@example.com`;

            const createRes = await request(app.getHttpServer())
                .post('/api/v1/users')
                .set('Cookie', `${superAdminAccessCookie}; ${superAdminRefreshCookie}; ${superAdminCsrfCookie}`)
                .set('X-CSRF-Token', superAdminCsrfToken)
                .send({
                    name: 'Backoffice User',
                    email: createdUserEmail,
                    password: 'TestPassword123!',
                    role: 'SUPER_ADMIN',
                    ownerId: null,
                })
                .expect(201);

            expect(createRes.body).toHaveProperty('id');
            expect(createRes.body).toHaveProperty('email', createdUserEmail);
            expect(createRes.body).not.toHaveProperty('hashedPassword');
            createdUserId = createRes.body.id;

            // Vérifier que l'AuthProvider LOCAL existe en base
            const authProviderRepo = dataSource.getRepository(AuthProvider);
            const authProvider = await authProviderRepo.findOne({
                where: { user: { id: createdUserId }, provider: AuthProviderType.LOCAL },
                relations: ['user'],
            });

            expect(authProvider).toBeDefined();
            expect(authProvider?.provider).toBe(AuthProviderType.LOCAL);
            expect(authProvider?.passwordHash).toBeDefined();
            expect(authProvider?.passwordHash).not.toBe('');
        });

        it('POST /auth/login - Login fonctionne avec AuthProvider LOCAL', async () => {
            const loginRes = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: createdUserEmail,
                    password: 'TestPassword123!',
                })
                .expect(201);

            expect(loginRes.body).toHaveProperty('access_token');
            expect(loginRes.body).toHaveProperty('user');
            expect(loginRes.body.user.email).toBe(createdUserEmail);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Cas B: Création via /auth/register
    //
    // NOTE: /auth/register est un endpoint de création de compte uniquement.
    // Il NE pose PAS de cookie de session (comportement intentionnel, voir
    // AuthController.register qui n'a pas @Res et ne fait pas setCookie).
    // L'utilisateur doit ensuite appeler /auth/login pour ouvrir une session.
    // Ce test vérifie le body de retour (user créé) + l'AuthProvider en base.
    // ─────────────────────────────────────────────────────────────────────────
    describe('Cas B: Création via /auth/register', () => {
        let createdUserEmail: string;
        let createdUserId: string;

        it('POST /auth/register - Crée un utilisateur avec AuthProvider LOCAL (body only, pas de cookie session)', async () => {
            const uniqueSuffix = Date.now();
            createdUserEmail = `register_user_${uniqueSuffix}@example.com`;

            const registerRes = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    name: 'Register User',
                    email: createdUserEmail,
                    password: 'TestPassword123!',
                })
                .expect(201);

            // register retourne le user dans le body, pas de session ouverte
            expect(registerRes.body).toHaveProperty('id');
            expect(registerRes.body).toHaveProperty('email', createdUserEmail);
            expect(registerRes.body).not.toHaveProperty('hashedPassword');
            // register ne crée pas de session : aucun cookie valide posé
            // (l'API peut effacer des cookies préexistants via Max-Age=0, ce qui est correct)

            createdUserId = registerRes.body.id;

            // Vérifier que l'AuthProvider LOCAL existe en base
            const authProviderRepo = dataSource.getRepository(AuthProvider);
            const authProvider = await authProviderRepo.findOne({
                where: { user: { id: createdUserId }, provider: AuthProviderType.LOCAL },
                relations: ['user'],
            });

            expect(authProvider).toBeDefined();
            expect(authProvider?.provider).toBe(AuthProviderType.LOCAL);
            expect(authProvider?.passwordHash).toBeDefined();
            expect(authProvider?.passwordHash).not.toBe('');
        });

        it('POST /auth/login - Login fonctionne après register (session via /login)', async () => {
            const loginRes = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: createdUserEmail,
                    password: 'TestPassword123!',
                })
                .expect(201);

            expect(loginRes.body).toHaveProperty('access_token');
            expect(loginRes.body).toHaveProperty('user');
            expect(loginRes.body.user.email).toBe(createdUserEmail);
            // login, lui, pose bien les cookies
            expect(extractCookie(loginRes.headers as Record<string, unknown>, 'access_token')).toBeDefined();
            expect(extractCookieValue(loginRes.headers as Record<string, unknown>, 'csrf_token')).toBeDefined();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // Cas C: Mise à jour du mot de passe via /users (endpoint backoffice)
    // ─────────────────────────────────────────────────────────────────────────
    describe('Cas C: Mise à jour du mot de passe via /users', () => {
        let createdUserEmail: string;
        let createdUserId: string;

        beforeAll(async () => {
            const uniqueSuffix = Date.now();
            createdUserEmail = `update_user_${uniqueSuffix}@example.com`;

            const createRes = await request(app.getHttpServer())
                .post('/api/v1/users')
                .set('Cookie', `${superAdminAccessCookie}; ${superAdminRefreshCookie}; ${superAdminCsrfCookie}`)
                .set('X-CSRF-Token', superAdminCsrfToken)
                .send({
                    name: 'Update User',
                    email: createdUserEmail,
                    password: 'OldPassword123!',
                    role: 'SUPER_ADMIN',
                    ownerId: null,
                })
                .expect(201);

            createdUserId = createRes.body.id;
        });

        it('PUT /users - Met à jour le mot de passe dans AuthProvider LOCAL', async () => {
            const authProviderRepo = dataSource.getRepository(AuthProvider);
            const oldAuthProvider = await authProviderRepo.findOne({
                where: { user: { id: createdUserId }, provider: AuthProviderType.LOCAL },
            });
            const oldHash = oldAuthProvider?.passwordHash;

            await request(app.getHttpServer())
                .put(`/api/v1/users/${createdUserId}`)
                .set('Cookie', `${superAdminAccessCookie}; ${superAdminRefreshCookie}; ${superAdminCsrfCookie}`)
                .set('X-CSRF-Token', superAdminCsrfToken)
                .send({ password: 'NewPassword123!' })
                .expect(200);

            // Vérifier que le hash a changé en base
            const newAuthProvider = await authProviderRepo.findOne({
                where: { user: { id: createdUserId }, provider: AuthProviderType.LOCAL },
            });

            expect(newAuthProvider).toBeDefined();
            expect(newAuthProvider?.passwordHash).toBeDefined();
            expect(newAuthProvider?.passwordHash).not.toBe(oldHash);
        });

        it('POST /auth/login - Login fonctionne avec le nouveau mot de passe', async () => {
            const loginRes = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: createdUserEmail,
                    password: 'NewPassword123!',
                })
                .expect(201);

            expect(loginRes.body).toHaveProperty('access_token');
        });

        it('POST /auth/login - Ancien mot de passe ne fonctionne plus', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: createdUserEmail,
                    password: 'OldPassword123!',
                })
                .expect(401);
        });
    });
});
