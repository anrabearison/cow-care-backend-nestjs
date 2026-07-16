import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieService } from './services/cookie.service';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { User, UserRole } from '../platform/users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let cookieService: jest.Mocked<CookieService>;
  let mockResponse: jest.Mocked<Response>;
  let mockRequest: any;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      loginWithGoogle: jest.fn(),
    } as any;

    cookieService = {
      setAccessTokenCookie: jest.fn(),
      setRefreshTokenCookie: jest.fn(),
      setCsrfCookie: jest.fn(),
      clearAllAuthCookies: jest.fn(),
    } as any;

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    } as any;

    mockRequest = {
      ip: '127.0.0.1',
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'Jest-Test-Agent',
      },
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: CookieService, useValue: cookieService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser: Omit<User, 'hashedPassword'> = {
      id: 'user-id-123',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.OWNER_USER,
      isActive: true,
      ownerId: 'owner-id-123',
      owner: null as any,
      authProviders: [],
      refreshSessions: [],
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };

    const mockLoginResponse = {
      access_token: 'signed-jwt-token',
      refresh_token: 'refresh_jwt_token',
      token_type: 'Bearer',
      user: {
        id: 'user-id-123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.OWNER_USER,
        isActive: true,
        ownerId: 'owner-id-123',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      },
    };

    it('✓ login réussi', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(mockRequest, loginDto, mockResponse);

      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password, { ipAddress: '127.0.0.1', userAgent: 'Jest-Test-Agent' });
      expect(authService.login).toHaveBeenCalledWith(mockUser, { ipAddress: '127.0.0.1', userAgent: 'Jest-Test-Agent' });
      expect(result).toBeDefined();
    });

    it('✓ cookie créé', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResponse);

      await controller.login(mockRequest, loginDto, mockResponse);

      expect(cookieService.setAccessTokenCookie).toHaveBeenCalledWith(mockResponse, 'signed-jwt-token');
    });

    it('✓ cookie HttpOnly', async () => {
      const mockConfig = {
        authCookies: {
          accessTokenName: 'access_token',
          refreshTokenName: 'refresh_token',
          secure: true,
          sameSite: 'lax' as const,
          domain: '.example.com',
          path: '/',
          maxAge: 30 * 60 * 1000,
        },
      };
      
      const configServiceMock: any = {
        get: jest.fn((key: string) => {
          if (key === 'authCookies') return mockConfig.authCookies;
          return undefined;
        }),
      };

      const realCookieService = new CookieService(configServiceMock);
      const tempController = new AuthController(authService, realCookieService);

      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResponse);

      await tempController.login(mockRequest, loginDto, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'signed-jwt-token',
        expect.objectContaining({
          httpOnly: true,
        })
      );
    });

    it('✓ cookie Secure', async () => {
      const mockConfig = {
        authCookies: {
          accessTokenName: 'access_token',
          refreshTokenName: 'refresh_token',
          secure: true,
          sameSite: 'lax' as const,
          domain: '.example.com',
          path: '/',
          maxAge: 30 * 60 * 1000,
        },
      };
      
      const configServiceMock: any = {
        get: jest.fn((key: string) => {
          if (key === 'authCookies') return mockConfig.authCookies;
          return undefined;
        }),
      };

      const realCookieService = new CookieService(configServiceMock);
      const tempController = new AuthController(authService, realCookieService);

      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResponse);

      await tempController.login(mockRequest, loginDto, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'signed-jwt-token',
        expect.objectContaining({
          secure: true,
        })
      );
    });

    it('✓ cookie SameSite', async () => {
      const mockConfig = {
        authCookies: {
          accessTokenName: 'access_token',
          refreshTokenName: 'refresh_token',
          secure: true,
          sameSite: 'lax' as const,
          domain: '.example.com',
          path: '/',
          maxAge: 30 * 60 * 1000,
        },
      };
      
      const configServiceMock: any = {
        get: jest.fn((key: string) => {
          if (key === 'authCookies') return mockConfig.authCookies;
          return undefined;
        }),
      };

      const realCookieService = new CookieService(configServiceMock);
      const tempController = new AuthController(authService, realCookieService);

      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResponse);

      await tempController.login(mockRequest, loginDto, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'signed-jwt-token',
        expect.objectContaining({
          sameSite: 'lax',
        })
      );
    });

    it('✓ cookie Path', async () => {
      const mockConfig = {
        authCookies: {
          accessTokenName: 'access_token',
          refreshTokenName: 'refresh_token',
          secure: true,
          sameSite: 'lax' as const,
          domain: '.example.com',
          path: '/custom-path',
          maxAge: 30 * 60 * 1000,
        },
      };
      
      const configServiceMock: any = {
        get: jest.fn((key: string) => {
          if (key === 'authCookies') return mockConfig.authCookies;
          return undefined;
        }),
      };

      const realCookieService = new CookieService(configServiceMock);
      const tempController = new AuthController(authService, realCookieService);

      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResponse);

      await tempController.login(mockRequest, loginDto, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'signed-jwt-token',
        expect.objectContaining({
          path: '/custom-path',
        })
      );
    });

    it('✓ cookie Domain', async () => {
      const mockConfig = {
        authCookies: {
          accessTokenName: 'access_token',
          refreshTokenName: 'refresh_token',
          secure: true,
          sameSite: 'lax' as const,
          domain: '.example.com',
          path: '/',
          maxAge: 30 * 60 * 1000,
        },
      };
      
      const configServiceMock: any = {
        get: jest.fn((key: string) => {
          if (key === 'authCookies') return mockConfig.authCookies;
          return undefined;
        }),
      };

      const realCookieService = new CookieService(configServiceMock);
      const tempController = new AuthController(authService, realCookieService);

      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResponse);

      await tempController.login(mockRequest, loginDto, mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'signed-jwt-token',
        expect.objectContaining({
          domain: '.example.com',
        })
      );
    });

    it('✓ JWT toujours présent dans la réponse', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResponse);

      const result = await controller.login(mockRequest, loginDto, mockResponse);

      expect(result.access_token).toBe('signed-jwt-token');
      expect(result.token_type).toBe('Bearer');
    });

    it('✓ mauvais mot de passe lève UnauthorizedException', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(mockRequest, loginDto, mockResponse)).rejects.toThrow(UnauthorizedException);
      expect(cookieService.setAccessTokenCookie).not.toHaveBeenCalled();
    });

    it('✓ utilisateur inexistant lève UnauthorizedException', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(mockRequest, loginDto, mockResponse)).rejects.toThrow(UnauthorizedException);
      expect(cookieService.setAccessTokenCookie).not.toHaveBeenCalled();
    });

    it('✓ cookie absent en cas d\'erreur', async () => {
      authService.validateUser.mockRejectedValue(new Error('DB connection failed'));

      await expect(controller.login(mockRequest, loginDto, mockResponse)).rejects.toThrow('DB connection failed');
      expect(cookieService.setAccessTokenCookie).not.toHaveBeenCalled();
    });
  });

  describe('getSessionUser', () => {
    const mockCurrentUser = {
      id: 'user-id-123',
      name: 'Test User',
      email: 'test@example.com',
      role: UserRole.OWNER_USER,
      isActive: true,
      ownerId: 'owner-id-123',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('✓ retourne l\'utilisateur courant (CurrentUserDto)', async () => {
      (authService as any).getCurrentUser = jest.fn().mockResolvedValue(mockCurrentUser);

      const req = { user: { id: 'user-id-123' } };
      const result = await controller.getSessionUser(req);

      expect((authService as any).getCurrentUser).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual(mockCurrentUser);
      expect(result).not.toHaveProperty('hashedPassword');
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('refreshToken');
    });

    it('✓ n\'appelle pas setAccessTokenCookie (aucun Set-Cookie)', async () => {
      (authService as any).getCurrentUser = jest.fn().mockResolvedValue(mockCurrentUser);

      const req = { user: { id: 'user-id-123' } };
      await controller.getSessionUser(req);

      expect(cookieService.setAccessTokenCookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('✓ appelle authService.logout avec le refresh token et nettoie les cookies', async () => {
      authService.logout = jest.fn().mockResolvedValue(undefined);
      cookieService.getCookieNames = jest.fn().mockReturnValue({ refreshToken: 'refresh_token' });
      const req = { 
        cookies: { 'refresh_token': 'my-refresh-token' },
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Jest-Test-Agent',
        },
        ip: '127.0.0.1',
      } as any;

      await controller.logout(req, mockResponse);

      expect(authService.logout).toHaveBeenCalledWith('my-refresh-token', { ipAddress: '127.0.0.1', userAgent: 'Jest-Test-Agent' });
      expect(cookieService.clearAllAuthCookies).toHaveBeenCalledWith(mockResponse);
    });

    it('✓ est idempotent si le cookie est manquant', async () => {
      authService.logout = jest.fn().mockResolvedValue(undefined);
      cookieService.getCookieNames = jest.fn().mockReturnValue({ refreshToken: 'refresh_token' });
      const req = { 
        cookies: {},
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Jest-Test-Agent',
        },
        ip: '127.0.0.1',
      } as any;

      await controller.logout(req, mockResponse);

      expect(authService.logout).toHaveBeenCalledWith(undefined, { ipAddress: '127.0.0.1', userAgent: 'Jest-Test-Agent' });
      expect(cookieService.clearAllAuthCookies).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('loginWithGoogle', () => {
    const mockGoogleDto = {
      code: 'google-auth-code',
      state: 'invitation-token',
    };

    const mockGoogleLoginResponse = {
      access_token: 'signed-jwt-token',
      refresh_token: 'refresh_jwt_token',
      token_type: 'Bearer',
      user: {
        id: 'user-id-123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.OWNER_USER,
        isActive: true,
        ownerId: 'owner-id-123',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    };

    it('✓ Google Login crée Access Cookie', async () => {
      authService.loginWithGoogle.mockResolvedValue(mockGoogleLoginResponse);

      await controller.loginWithGoogle(mockRequest, mockGoogleDto, mockResponse);

      expect(cookieService.setAccessTokenCookie).toHaveBeenCalledWith(mockResponse, 'signed-jwt-token');
    });

    it('✓ Google Login crée Refresh Cookie', async () => {
      authService.loginWithGoogle.mockResolvedValue(mockGoogleLoginResponse);

      await controller.loginWithGoogle(mockRequest, mockGoogleDto, mockResponse);

      expect(cookieService.setRefreshTokenCookie).toHaveBeenCalledWith(mockResponse, 'refresh_jwt_token');
    });

    it('✓ Google Login utilise les mêmes métadonnées que login classique', async () => {
      authService.loginWithGoogle.mockResolvedValue(mockGoogleLoginResponse);

      await controller.loginWithGoogle(mockRequest, mockGoogleDto, mockResponse);

      expect(authService.loginWithGoogle).toHaveBeenCalledWith(
        'google-auth-code',
        'invitation-token',
        { ipAddress: '127.0.0.1', userAgent: 'Jest-Test-Agent' }
      );
    });

    it('✓ Google Login retourne les informations utilisateur', async () => {
      authService.loginWithGoogle.mockResolvedValue(mockGoogleLoginResponse);

      const result = await controller.loginWithGoogle(mockRequest, mockGoogleDto, mockResponse);

      expect(result).toHaveProperty('user');
      expect(result.user).toEqual(mockGoogleLoginResponse.user);
      expect(result).toHaveProperty('access_token', 'signed-jwt-token');
      expect(result).toHaveProperty('token_type', 'Bearer');
    });

    it('✓ Google Login ne crée pas de cookies en cas d\'erreur', async () => {
      authService.loginWithGoogle.mockRejectedValue(new Error('Google OAuth failed'));

      await expect(controller.loginWithGoogle(mockRequest, mockGoogleDto, mockResponse))
        .rejects.toThrow('Google OAuth failed');

      expect(cookieService.setAccessTokenCookie).not.toHaveBeenCalled();
      expect(cookieService.setRefreshTokenCookie).not.toHaveBeenCalled();
    });
  });
});
