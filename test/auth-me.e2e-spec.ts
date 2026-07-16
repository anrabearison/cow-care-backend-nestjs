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
import { JwtService } from '@nestjs/jwt';

describe('Auth Me (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let userAEmail: string;
    let userBEmail: string;
    let deactivatedUserEmail: string;

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
        const queryRunner = dataSource.createQueryRunner();
        await queryRunner.connect();

        const hashedPassword = await bcrypt.hash('password123', 10);
        const uniqueSuffix = Date.now();

        const createTestUser = async (email: string, isActive: boolean = true) => {
            const user = userRepo.create({
                id: randomUUID(),
                name: `User ${email}`,
                email,
                hashedPassword,
                role: UserRole.OWNER_USER,
                isActive,
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

        userAEmail = `userA_${uniqueSuffix}@example.com`;
        userBEmail = `userB_${uniqueSuffix}@example.com`;
        deactivatedUserEmail = `deactivated_${uniqueSuffix}@example.com`;

        await createTestUser(userAEmail, true);
        await createTestUser(userBEmail, true);
        await createTestUser(deactivatedUserEmail, false);

        await queryRunner.release();
    });

    afterAll(async () => {
        await app.close();
    });

    const loginAndGetTokens = async (email: string) => {
        const res = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ email, password: 'password123' });
        
        const setCookieHeader = res.headers['set-cookie'] as unknown as string[] | undefined;
        const cookie = setCookieHeader?.find((c: string) => c.startsWith('access_token='));
        return {
            cookie,
            bearer: res.body.access_token,
        };
    };

    it('✓ Login -> GET /auth/me (Cookie HttpOnly)', async () => {
        const { cookie } = await loginAndGetTokens(userAEmail);
        
        const res = await request(app.getHttpServer())
            .get('/api/v1/auth/me')
            .set('Cookie', cookie || '');

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(userAEmail);
        // Vérification de l'absence de données sensibles
        expect(res.body.hashedPassword).toBeUndefined();
        expect(res.body.password).toBeUndefined();
        expect(res.body.refreshToken).toBeUndefined();
        
        // Assert no Set-Cookie
        expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('✓ Login -> GET /auth/me (Bearer Token fallback)', async () => {
        const { bearer } = await loginAndGetTokens(userAEmail);
        
        const res = await request(app.getHttpServer())
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${bearer}`);

        expect(res.status).toBe(200);
        expect(res.body.email).toBe(userAEmail);
        expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('✓ Cookie + Bearer simultanés -> Cookie est prioritaire', async () => {
        const authA = await loginAndGetTokens(userAEmail); // Cookie User A
        const authB = await loginAndGetTokens(userBEmail); // Bearer User B
        
        const res = await request(app.getHttpServer())
            .get('/api/v1/auth/me')
            .set('Cookie', authA.cookie || '')
            .set('Authorization', `Bearer ${authB.bearer}`);

        expect(res.status).toBe(200);
        // Si le cookie est bien prioritaire, c'est User A qui est retourné
        expect(res.body.email).toBe(userAEmail);
    });

    it('✓ Sans authentification -> 401', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/v1/auth/me');

        expect(res.status).toBe(401);
    });

    it('✓ Cookie expiré/invalide -> 401', async () => {
        const res = await request(app.getHttpServer())
            .get('/api/v1/auth/me')
            .set('Cookie', 'access_token=invalid_token_value');

        expect(res.status).toBe(401);
    });

    it('✓ Utilisateur désactivé -> 401', async () => {
        // Obtenir un token en bidouillant un peu car login() devrait normalement empêcher
        // de se connecter si désactivé (dans un vrai flux). Mais testons via un vieux token.
        // On va générer manuellement un token valide pour l'utilisateur désactivé pour simuler la situation
        const jwtService = app.get(JwtService); // ou le récupérer dynamiquement
        const userRepo = dataSource.getRepository(User);
        const deactivatedUser = await userRepo.findOne({ where: { email: deactivatedUserEmail } });
        
        const token = jwtService.sign({ 
            sub: deactivatedUser.email, 
            id: deactivatedUser.id, 
            role: deactivatedUser.role, 
            ownerId: deactivatedUser.ownerId 
        });

        const res = await request(app.getHttpServer())
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
    });
});
