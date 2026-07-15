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

describe('Auth Login (e2e)', () => {
    let app: INestApplication;
    let dataSource: DataSource;
    let configService: ConfigService;
    let testUserEmail: string;

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
        testUserEmail = `user${uniqueSuffix}@example.com`;
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const userRepo = dataSource.getRepository(User);
        const user = userRepo.create({
            id: randomUUID(),
            name: `Test User ${uniqueSuffix}`,
            email: testUserEmail,
            hashedPassword,
            role: UserRole.OWNER_USER,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await userRepo.save(user);

        // Link with LOCAL provider for AuthProviderService compatibility
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
        if (testUserEmail) {
            const userRepo = dataSource.getRepository(User);
            const user = await userRepo.findOne({ where: { email: testUserEmail } });
            if (user) {
                const queryRunner = dataSource.createQueryRunner();
                await queryRunner.connect();
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

    it('POST /auth/login - Connexion réussie avec cookie et compatibilité body', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/v1/platform/auth/login')
            .send({
                email: testUserEmail,
                password: 'password123',
            })
            .expect(201);

        // 1. Vérifier la présence du JWT dans le corps (phase de compatibilité)
        expect(response.body.access_token).toBeDefined();
        expect(typeof response.body.access_token).toBe('string');
        expect(response.body.token_type).toBe('Bearer');
        expect(response.body.user).toBeDefined();
        expect(response.body.user.email).toBe(testUserEmail);

        // 2. Vérifier la présence du Set-Cookie
        const setCookieHeader = response.header['set-cookie'];
        expect(setCookieHeader).toBeDefined();
        expect(Array.isArray(setCookieHeader)).toBe(true);

        const cookieConfig = configService.get('authCookies');
        const cookieName = cookieConfig.accessTokenName || 'access_token';

        const parsedCookie = parseCookie(setCookieHeader, cookieName);
        expect(parsedCookie).not.toBeNull();
        expect(parsedCookie.value).toBe(response.body.access_token);

        // 3. Vérifier les attributs du cookie (HttpOnly, Secure, SameSite, Path, Domain)
        expect(parsedCookie.attrs['httponly']).toBe(true);
        
        if (cookieConfig.secure) {
            expect(parsedCookie.attrs['secure']).toBe(true);
        } else {
            expect(parsedCookie.attrs['secure']).toBeUndefined();
        }

        if (cookieConfig.sameSite) {
            expect(String(parsedCookie.attrs['samesite']).toLowerCase()).toBe(String(cookieConfig.sameSite).toLowerCase());
        }

        if (cookieConfig.path) {
            expect(parsedCookie.attrs['path']).toBe(cookieConfig.path);
        }

        if (cookieConfig.domain) {
            expect(parsedCookie.attrs['domain']).toBe(cookieConfig.domain);
        }

        // 4. Vérifier l'absence de fuite du JWT dans les headers
        const jwtToken = response.body.access_token;
        for (const [headerName, headerValue] of Object.entries(response.headers)) {
            if (headerName.toLowerCase() === 'set-cookie') continue;
            
            const valueStr = String(headerValue);
            expect(valueStr.includes(jwtToken)).toBe(false);
        }
    });

    it('POST /auth/login - Mauvais identifiants ne retournent pas de cookie', async () => {
        const response = await request(app.getHttpServer())
            .post('/api/v1/platform/auth/login')
            .send({
                email: testUserEmail,
                password: 'wrongpassword',
            })
            .expect(401);

        // Pas de Set-Cookie en cas d'erreur
        const setCookieHeader = response.header['set-cookie'];
        if (setCookieHeader) {
            const cookieConfig = configService.get('authCookies');
            const cookieName = cookieConfig.accessTokenName || 'access_token';
            const parsedCookie = parseCookie(setCookieHeader, cookieName);
            expect(parsedCookie).toBeNull();
        }
    });
});
