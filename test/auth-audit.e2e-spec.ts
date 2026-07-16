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
import { AuthAuditLog } from '../src/modules/auth/entities/auth-audit-log.entity';
import { AuthAuditEvent } from '../src/modules/auth/enums/auth-audit-event.enum';

describe('Auth Audit Logs (e2e)', () => {
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
        testUserEmail = `audit-user${uniqueSuffix}@example.com`;
        testUserId = randomUUID();
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const userRepo = dataSource.getRepository(User);
        const user = userRepo.create({
            id: testUserId,
            name: `Audit Test User ${uniqueSuffix}`,
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
        // Clean up user and audit logs
        if (testUserId) {
            const userRepo = dataSource.getRepository(User);
            const auditLogRepo = dataSource.getRepository(AuthAuditLog);
            
            const user = await userRepo.findOne({ where: { id: testUserId } });
            if (user) {
                const queryRunner = dataSource.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.query('DELETE FROM refresh_sessions WHERE user_id = $1', [user.id]);
                await queryRunner.query('DELETE FROM auth_providers WHERE user_id = $1', [user.id]);
                await queryRunner.release();
                await userRepo.remove(user);
            }

            // Clean up audit logs
            await auditLogRepo.delete({ email: testUserEmail });
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

    describe('Cas 1: Login réussi → LOGIN_SUCCESS', () => {
        it('POST /auth/login - Crée LOGIN_SUCCESS audit log', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'password123',
                })
                .expect(201);

            const auditLogRepo = dataSource.getRepository(AuthAuditLog);
            const auditLogs = await auditLogRepo.find({
                where: { email: testUserEmail, eventType: AuthAuditEvent.LOGIN_SUCCESS },
                order: { createdAt: 'DESC' },
                take: 1,
            });

            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].success).toBe(true);
            expect(auditLogs[0].userId).toBe(testUserId);
        });
    });

    describe('Cas 2: Login échoué → LOGIN_FAILED', () => {
        it('POST /auth/login - Crée LOGIN_FAILED audit log', async () => {
            await request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'wrongpassword',
                })
                .expect(401);

            const auditLogRepo = dataSource.getRepository(AuthAuditLog);
            const auditLogs = await auditLogRepo.find({
                where: { email: testUserEmail, eventType: AuthAuditEvent.LOGIN_FAILED },
                order: { createdAt: 'DESC' },
                take: 1,
            });

            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].success).toBe(false);
            expect(auditLogs[0].failureReason).toBe('Invalid password');
        });
    });

    describe('Cas 3: Refresh réussi → REFRESH_SUCCESS', () => {
        it('POST /auth/refresh - Crée REFRESH_SUCCESS audit log', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login first
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

            // Refresh tokens
            await agent
                .post('/api/v1/auth/refresh')
                .set('X-CSRF-Token', csrfToken)
                .expect(204);

            const auditLogRepo = dataSource.getRepository(AuthAuditLog);
            const auditLogs = await auditLogRepo.find({
                where: { email: testUserEmail, eventType: AuthAuditEvent.REFRESH_SUCCESS },
                order: { createdAt: 'DESC' },
                take: 1,
            });

            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].success).toBe(true);
        });
    });

    describe('Cas 4: Logout → LOGOUT', () => {
        it('POST /auth/logout - Crée LOGOUT audit log', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login first
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

            // Logout
            await agent
                .post('/api/v1/auth/logout')
                .set('X-CSRF-Token', csrfToken)
                .expect(204);

            const auditLogRepo = dataSource.getRepository(AuthAuditLog);
            const auditLogs = await auditLogRepo.find({
                where: { email: testUserEmail, eventType: AuthAuditEvent.LOGOUT },
                order: { createdAt: 'DESC' },
                take: 1,
            });

            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].success).toBe(true);
        });
    });

    describe('Cas 5: CSRF failure → CSRF_FAILURE', () => {
        it('POST /auth/logout sans CSRF header → Crée CSRF_FAILURE audit log', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login first
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

            const auditLogRepo = dataSource.getRepository(AuthAuditLog);
            const auditLogs = await auditLogRepo.find({
                where: { eventType: AuthAuditEvent.CSRF_FAILURE },
                order: { createdAt: 'DESC' },
                take: 1,
            });

            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].success).toBe(false);
            expect(auditLogs[0].failureReason).toBe('CSRF header missing');
        });
    });

    describe('Cas 6: Session revoke → SESSION_REVOKED', () => {
        it('DELETE /auth/sessions/:id - Crée SESSION_REVOKED audit log', async () => {
            const agent = request.agent(app.getHttpServer());

            // Login first
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

            // Get sessions
            const sessionsResponse = await agent
                .get('/api/v1/auth/sessions')
                .set('X-CSRF-Token', csrfToken)
                .expect(200);

            const sessions = sessionsResponse.body;
            if (sessions.length > 0) {
                const sessionId = sessions[0].id;

                // Delete session
                await agent
                    .delete(`/api/v1/auth/sessions/${sessionId}`)
                    .set('X-CSRF-Token', csrfToken)
                    .expect(204);

                const auditLogRepo = dataSource.getRepository(AuthAuditLog);
                const auditLogs = await auditLogRepo.find({
                    where: { email: testUserEmail, eventType: AuthAuditEvent.SESSION_REVOKED },
                    order: { createdAt: 'DESC' },
                    take: 1,
                });

                expect(auditLogs.length).toBeGreaterThan(0);
                expect(auditLogs[0].success).toBe(true);
            }
        });
    });

    describe('Cas 7: Rate limiting', () => {
        it('POST /auth/login - 5 tentatives successives → 429', async () => {
            const agent = request.agent(app.getHttpServer());

            // Make 5 failed login attempts
            for (let i = 0; i < 5; i++) {
                await agent
                    .post('/api/v1/auth/login')
                    .send({
                        email: testUserEmail,
                        password: 'wrongpassword',
                    })
                    .expect(401);
            }

            // 6th attempt should be rate limited
            await agent
                .post('/api/v1/auth/login')
                .send({
                    email: testUserEmail,
                    password: 'wrongpassword',
                })
                .expect(429);

            // Clean up audit logs
            const auditLogRepo = dataSource.getRepository(AuthAuditLog);
            await auditLogRepo.delete({ email: testUserEmail, eventType: AuthAuditEvent.LOGIN_FAILED });
        });
    });

    describe('Cas 8: 10 échecs → UNAUTHORIZED_ACCESS', () => {
        it('10 LOGIN_FAILED en moins de 10 minutes → Crée UNAUTHORIZED_ACCESS audit log', async () => {
            const agent = request.agent(app.getHttpServer());

            // Make 10 failed login attempts
            for (let i = 0; i < 10; i++) {
                await agent
                    .post('/api/v1/auth/login')
                    .send({
                        email: testUserEmail,
                        password: 'wrongpassword',
                    })
                    .expect(401);
            }

            // Check for UNAUTHORIZED_ACCESS audit log
            const auditLogRepo = dataSource.getRepository(AuthAuditLog);
            const auditLogs = await auditLogRepo.find({
                where: { email: testUserEmail, eventType: AuthAuditEvent.UNAUTHORIZED_ACCESS },
                order: { createdAt: 'DESC' },
                take: 1,
            });

            expect(auditLogs.length).toBeGreaterThan(0);
            expect(auditLogs[0].success).toBe(true);
            expect(auditLogs[0].failureReason).toContain('10 failed login attempts');

            // Clean up audit logs
            await auditLogRepo.delete({ email: testUserEmail });
        });
    });
});
