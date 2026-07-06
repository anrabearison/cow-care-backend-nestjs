import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt');

import { AuthService } from './auth.service';
import { AuthProviderService } from './services/auth-provider.service';
import { InvitationService } from './services/invitation.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { AuthProviderType } from './entities/auth-provider.entity';
import { User, UserRole } from '../users/entities/user.entity';

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
  let userRepo: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };
  let jwtService: { sign: jest.Mock };
  let authProviderMock: any;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn(async (user: any) => user),
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed-jwt-token') };

    authProviderMock = {
      findByUser: jest.fn().mockResolvedValue([]),
      updateLastLogin: jest.fn().mockResolvedValue(undefined),
      createLocalProvider: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
        // Mocks for newly introduced dependencies
        { provide: AuthProviderService, useValue: authProviderMock },
        { provide: InvitationService, useValue: {} },
        { provide: GoogleOAuthService, useValue: {} },
      ],
    }).compile();

    service = module.get(AuthService);
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
  });

  // ── getProfile ────────────────────────────────

  describe('getProfile()', () => {
    it('retourne le profil sans hashedPassword', async () => {
      const user = makeUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.getProfile('alice@example.com');

      expect(result).not.toHaveProperty('hashedPassword');
      expect(result.email).toBe('alice@example.com');
    });

    it("lève UnauthorizedException si l'utilisateur est absent", async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.getProfile('unknown@example.com')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
