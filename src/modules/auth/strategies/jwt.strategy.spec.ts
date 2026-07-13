import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'security.secretKey') {
          return 'test-secret-key';
        }
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    authService = {
      resolveUserFromJwtSubject: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should return user when valid payload is provided', async () => {
      const payload = {
        sub: 'user@example.com',
        id: 'user-123',
        role: 'OWNER_USER',
        ownerId: 'owner-456',
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'OWNER_USER',
        ownerId: 'owner-456',
        name: 'Test User',
      };

      (authService.resolveUserFromJwtSubject as jest.Mock).mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(authService.resolveUserFromJwtSubject).toHaveBeenCalledWith('user@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      const payload = {
        sub: 'nonexistent@example.com',
        id: 'user-999',
        role: 'OWNER_USER',
      };

      (authService.resolveUserFromJwtSubject as jest.Mock).mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should add ownerId to user if missing in user but present in payload', async () => {
      const payload = {
        sub: 'user@example.com',
        id: 'user-123',
        role: 'OWNER_USER',
        ownerId: 'owner-456',
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'OWNER_USER',
        ownerId: undefined, // Missing ownerId
        name: 'Test User',
      };

      (authService.resolveUserFromJwtSubject as jest.Mock).mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(result.ownerId).toBe('owner-456');
    });

    it('should handle user ID as sub (new tokens)', async () => {
      const payload = {
        sub: 'user-123', // User ID instead of email
        id: 'user-123',
        role: 'OWNER_USER',
        ownerId: 'owner-456',
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'OWNER_USER',
        ownerId: 'owner-456',
        name: 'Test User',
      };

      (authService.resolveUserFromJwtSubject as jest.Mock).mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(authService.resolveUserFromJwtSubject).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
    });

    it('should handle email as sub (legacy tokens)', async () => {
      const payload = {
        sub: 'user@example.com', // Email as sub
        id: 'user-123',
        role: 'OWNER_USER',
        ownerId: 'owner-456',
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'OWNER_USER',
        ownerId: 'owner-456',
        name: 'Test User',
      };

      (authService.resolveUserFromJwtSubject as jest.Mock).mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(authService.resolveUserFromJwtSubject).toHaveBeenCalledWith('user@example.com');
      expect(result).toEqual(mockUser);
    });
  });
});
