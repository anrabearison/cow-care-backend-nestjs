import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt');
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthProviderService } from './services/auth-provider.service';
import { InvitationService } from './services/invitation.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { AuthProviderType } from './entities/auth-provider.entity';
import { User, UserRole } from '../platform/users/entities/user.entity';
import { EmailService } from '../../common/services/email.service';
import { CookieService } from './services/cookie.service';
import { AuditService } from './services/audit.service';
import { RefreshSession } from './entities/refresh-session.entity';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    hashedPassword: 'hashed_password',
    role: UserRole.OWNER_USER,
    ownerId: 'owner-1',
    isActive: true,
    owner: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as User);

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;
  let moduleRef: TestingModule;
  let userRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: { sign: jest.Mock; verify: jest.Mock };
  let authProviderMock: any;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn(async (user: any) => user),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt-token'), verify: jest.fn() } as any;

    authProviderMock = {
      findByUser: jest.fn().mockResolvedValue([]),
      findByProviderAndUserId: jest.fn().mockResolvedValue(null),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
      createLocalProvider: jest.fn().mockResolvedValue(undefined),
      createOAuthProvider: jest.fn().mockResolvedValue(undefined),
      linkOAuthProvider: jest.fn().mockResolvedValue(undefined),
    };

    const emailServiceMock = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    };

    const cookieServiceMock = {
      setAccessTokenCookie: jest.fn(),
      clearAccessTokenCookie: jest.fn(),
    };

    const auditServiceMock = {
      logEvent: jest.fn().mockResolvedValue(undefined),
      detectSuspiciousActivity: jest.fn().mockResolvedValue(false),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(RefreshSession), useValue: { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), update: jest.fn() } },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('mock-secret') } },
        { provide: AuthProviderService, useValue: authProviderMock },
        { provide: InvitationService, useValue: {} },
        { provide: GoogleOAuthService, useValue: {} },
        { provide: EmailService, useValue: emailServiceMock },
        { provide: CookieService, useValue: cookieServiceMock },
        { provide: AuditService, useValue: auditServiceMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  // ── validateUser ─────────────────────────────

  describe('validateUser()', () => {
    it("retourne l'utilisateur sans hashedPassword si les credentials sont corrects", async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Ensure a LOCAL provider exists with a matching passwordHash
      authProviderMock.findByUser.mockResolvedValue([
        { provider: AuthProviderType.LOCAL, passwordHash: 'hashed_password' },
      ]);

      const result = await service.validateUser('alice@example.com', 'correct_password');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('hashedPassword');
      expect(result.email).toBe('alice@example.com');
    });

    it('retourne null si le mot de passe est incorrect', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('alice@example.com', 'wrong_password');

      expect(result).toBeNull();
    });

    it("retourne null si l'utilisateur n'existe pas", async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.validateUser('unknown@example.com', 'any_password');

      expect(result).toBeNull();
    });

    it('lève UnauthorizedException si l\'utilisateur est désactivé', async () => {
      const user = makeUser({ isActive: false });
      userRepo.findOne.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      authProviderMock.findByUser.mockResolvedValue([
        { provider: AuthProviderType.LOCAL, passwordHash: 'hashed_password' },
      ]);

      await expect(service.validateUser('alice@example.com', 'correct_password'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  // ── login ─────────────────────────────────────

  describe('login()', () => {
    it('retourne access_token et les informations utilisateur', async () => {
      const user = makeUser();

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token', 'signed-jwt-token');
      expect(result).toHaveProperty('token_type', 'Bearer');
      expect(result.user).toBeDefined();
      expect(result.user).not.toHaveProperty('hashedPassword');
    });

    it('signe le JWT avec le payload correct (sub=email)', async () => {
      const user = makeUser();

      await service.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: user.email,
          id: user.id,
          role: user.role,
          ownerId: user.ownerId,
        }),
      );
    });
  });

  // ── register ─────────────────────────────────

  describe('register()', () => {
    it("lève BadRequestException si l'email est déjà enregistré", async () => {
      userRepo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.register({ name: 'Alice', email: 'alice@example.com', password: 'pass' }),
      ).rejects.toThrow(BadRequestException);
    });

    it("crée un nouvel utilisateur haché si l'email est disponible", async () => {
      userRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      const result = await service.register({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret123',
      });

      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'bob@example.com',
          role: UserRole.OWNER_USER,
          isActive: true,
        }),
      );
      // Ensure local provider creation was invoked with the new user and raw password
      expect(authProviderMock.createLocalProvider).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'bob@example.com' }),
        'secret123',
      );
      expect(result).not.toHaveProperty('hashedPassword');
    });
  });

  // ── resolveUserFromJwtSubject ─────────────────

  describe('resolveUserFromJwtSubject()', () => {
    it('cherche par email si sub contient "@"', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      await service.resolveUserFromJwtSubject('alice@example.com');

      expect(userRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'alice@example.com' } }),
      );
    });

    it('cherche par id si sub ne contient pas "@"', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      await service.resolveUserFromJwtSubject('user-1');

      expect(userRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'user-1' } }),
      );
    });

    it("retourne null si l'utilisateur est introuvable", async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.resolveUserFromJwtSubject('unknown@example.com');
      expect(result).toBeNull();
    });

    it('retourne le user sans hashedPassword', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.resolveUserFromJwtSubject('alice@example.com');

      expect(result).not.toHaveProperty('hashedPassword');
    });

    it('retourne null si l\'utilisateur est désactivé', async () => {
      const user = makeUser({ isActive: false });
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.resolveUserFromJwtSubject('alice@example.com');

      expect(result).toBeNull();
    });
  });

  // ── getCurrentUser ────────────────────────────────

  describe('getCurrentUser()', () => {
    it('retourne le profil sans hashedPassword ni info sensible (CurrentUserDto)', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.getCurrentUser('user-1');

      expect(result).not.toHaveProperty('hashedPassword');
      expect(result.email).toBe('alice@example.com');
      expect(result.isActive).toBe(true);
    });

    it("lève UnauthorizedException si l'utilisateur est absent", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getCurrentUser('unknown-id')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it("lève UnauthorizedException si l'utilisateur est désactivé", async () => {
      const user = makeUser({ isActive: false });
      userRepo.findOne.mockResolvedValue(user);

      await expect(service.getCurrentUser('user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ── loginWithGoogle ────────────────────────────

  describe('loginWithGoogle()', () => {
    let googleOAuthMock: any;
    let invitationMock: any;
    let emailServiceMock: any;

    beforeEach(async () => {
      googleOAuthMock = {
        exchangeCodeForTokens: jest.fn().mockResolvedValue({
          id_token: 'mock_id_token',
        }),
        verifyIdToken: jest.fn().mockResolvedValue({
          email: 'alice@example.com',
          sub: 'google_sub_123',
          emailVerified: true,
        }),
      };

      invitationMock = {
        validateInvitation: jest.fn().mockResolvedValue({
          email: 'alice@example.com',
          role: UserRole.OWNER_ADMIN,
          ownerId: 'owner-2',
          token: 'invitation_token',
        }),
        markAsUsed: jest.fn().mockResolvedValue(undefined),
      };

      emailServiceMock = {
        sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
      };

      const cookieServiceMock = {
        setAccessTokenCookie: jest.fn(),
        clearAccessTokenCookie: jest.fn(),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: getRepositoryToken(User), useValue: userRepo },
          { provide: getRepositoryToken(RefreshSession), useValue: { create: jest.fn(), save: jest.fn(), findOne: jest.fn(), update: jest.fn() } },
          { provide: JwtService, useValue: jwtService },
          { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('mock-secret') } },
          { provide: AuthProviderService, useValue: authProviderMock },
          { provide: InvitationService, useValue: invitationMock },
          { provide: GoogleOAuthService, useValue: googleOAuthMock },
          { provide: EmailService, useValue: emailServiceMock },
          { provide: CookieService, useValue: cookieServiceMock },
          { provide: AuditService, useValue: { logEvent: jest.fn().mockResolvedValue(undefined), detectSuspiciousActivity: jest.fn().mockResolvedValue(false) } },
        ],
      }).compile();

      service = module.get(AuthService);
    });

    it('met à jour le rôle et l\'activation d\'un utilisateur existant via invitation', async () => {
      const existingUser = makeUser({
        id: 'user-1',
        email: 'alice@example.com',
        role: UserRole.OWNER_USER,
        ownerId: 'owner-1',
        isActive: false,
      });

      userRepo.findOne.mockResolvedValue(existingUser);
      authProviderMock.findByUser.mockResolvedValue([]); // No Google provider yet
      authProviderMock.linkOAuthProvider.mockResolvedValue({});

      await service.loginWithGoogle('google_code', 'invitation_token');

      expect(invitationMock.validateInvitation).toHaveBeenCalledWith('invitation_token');
      expect(existingUser.role).toBe(UserRole.OWNER_ADMIN);
      expect(existingUser.ownerId).toBe('owner-2');
      expect(existingUser.isActive).toBe(true);
      expect(userRepo.save).toHaveBeenCalledWith(existingUser);
      expect(invitationMock.markAsUsed).toHaveBeenCalledWith('invitation_token');
    });

    it('lève BadRequestException si email ne correspond pas à l\'invitation', async () => {
      const existingUser = makeUser({ email: 'alice@example.com' });
      userRepo.findOne.mockResolvedValue(existingUser);
      authProviderMock.findByUser.mockResolvedValue([]);

      invitationMock.validateInvitation.mockResolvedValue({
        email: 'different@example.com', // Email différent
        role: UserRole.OWNER_ADMIN,
        ownerId: 'owner-2',
      });

      await expect(service.loginWithGoogle('google_code', 'invitation_token'))
        .rejects.toThrow(BadRequestException);
    });

    it('ne modifie pas l\'utilisateur existant sans invitation', async () => {
      const existingUser = makeUser({
        role: UserRole.OWNER_USER,
        ownerId: 'owner-1',
        isActive: true, // Utilisateur actif pour ce test
      });

      userRepo.findOne.mockResolvedValue(existingUser);
      authProviderMock.findByUser.mockResolvedValue([]);
      authProviderMock.linkOAuthProvider.mockResolvedValue({});

      await service.loginWithGoogle('google_code', null);

      expect(invitationMock.validateInvitation).not.toHaveBeenCalled();
      expect(existingUser.role).toBe(UserRole.OWNER_USER); // Inchangé
      expect(existingUser.ownerId).toBe('owner-1'); // Inchangé
      expect(existingUser.isActive).toBe(true); // Inchangé
    });
  });

  // ── logout ─────────────────────────────

  describe('logout()', () => {
    let mockSessionRepo: any;
    
    beforeEach(() => {
      mockSessionRepo = userRepo; // userRepo is mocked, but wait... let's properly mock refreshSessionRepository.
      // Wait, earlier the provider for RefreshSession was mocked inline.
      // I need to extract it to a variable or get it from the module.
      mockSessionRepo = moduleRef.get(getRepositoryToken(RefreshSession));
      mockSessionRepo.findOne = jest.fn();
      mockSessionRepo.save = jest.fn();
      jwtService.verify = jest.fn();
    });

    it('✓ idempotent si aucun refreshToken n\'est fourni', async () => {
      await service.logout(undefined);
      expect(jwtService.verify).not.toHaveBeenCalled();
      expect(mockSessionRepo.findOne).not.toHaveBeenCalled();
    });

    it('✓ idempotent si le refreshToken est invalide', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await service.logout('invalid-token');
      expect(mockSessionRepo.findOne).not.toHaveBeenCalled();
    });

    it('✓ idempotent si le sessionId manque dans le payload', async () => {
      jwtService.verify.mockReturnValue({ sub: 'test@example.com' }); // Pas de sessionId

      await service.logout('token-without-session-id');
      expect(mockSessionRepo.findOne).not.toHaveBeenCalled();
    });

    it('✓ idempotent si la session n\'existe pas', async () => {
      jwtService.verify.mockReturnValue({ sessionId: 'session-123' });
      mockSessionRepo.findOne.mockResolvedValue(null);

      await service.logout('valid-token-no-session');
      expect(mockSessionRepo.save).not.toHaveBeenCalled();
    });

    it('✓ idempotent si la session est déjà révoquée', async () => {
      jwtService.verify.mockReturnValue({ sessionId: 'session-123' });
      mockSessionRepo.findOne.mockResolvedValue({ id: 'session-123', revokedAt: new Date() });

      await service.logout('valid-token-revoked-session');
      expect(mockSessionRepo.save).not.toHaveBeenCalled();
    });

    it('✓ idempotent si le hash du token ne correspond pas (ex: token obsolète)', async () => {
      jwtService.verify.mockReturnValue({ sessionId: 'session-123' });
      const hashString = (service as any).hashString('old-token');
      mockSessionRepo.findOne.mockResolvedValue({
        id: 'session-123',
        refreshTokenHash: 'different-hash',
        revokedAt: null,
      });

      await service.logout('old-token');
      expect(mockSessionRepo.save).not.toHaveBeenCalled();
    });

    it('✓ révoque la session si tout est valide', async () => {
      jwtService.verify.mockReturnValue({ sessionId: 'session-123' });
      
      const token = 'valid-token';
      const hashString = (service as any).hashString(token);
      
      const session = {
        id: 'session-123',
        refreshTokenHash: hashString,
        revokedAt: null,
        user: { id: 'user-1', email: 'alice@example.com' },
      };
      
      mockSessionRepo.findOne.mockResolvedValue(session);

      await service.logout(token);
      
      expect(session.revokedAt).toBeInstanceOf(Date);
      expect(mockSessionRepo.save).toHaveBeenCalledWith(session);
      
      // Verify that ignoreExpiration is passed
      expect(jwtService.verify).toHaveBeenCalledWith(token, expect.objectContaining({
        ignoreExpiration: true
      }));
    });
  });
});
