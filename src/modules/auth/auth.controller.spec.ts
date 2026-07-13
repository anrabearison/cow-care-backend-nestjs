import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieService } from './services/cookie.service';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { User, UserRole } from '../users/entities/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let cookieService: jest.Mocked<CookieService>;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
    } as any;

    cookieService = {
      setAccessTokenCookie: jest.fn(),
    } as any;

    mockResponse = {
      cookie: jest.fn(),
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
      owner: null,
      authProviders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockLoginResponse = {
      access_token: 'signed-jwt-token',
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

      const result = await controller.login(loginDto, mockResponse);

      expect(authService.validateUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toBeDefined();
    });

    it('✓ cookie créé', async () => {
      authService.validateUser.mockResolvedValue(mockUser);
      authService.login.mockResolvedValue(mockLoginResponse);

      await controller.login(loginDto, mockResponse);

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

      await tempController.login(loginDto, mockResponse);

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

      await tempController.login(loginDto, mockResponse);

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

      await tempController.login(loginDto, mockResponse);

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

      await tempController.login(loginDto, mockResponse);

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

      await tempController.login(loginDto, mockResponse);

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

      const result = await controller.login(loginDto, mockResponse);

      expect(result.access_token).toBe('signed-jwt-token');
      expect(result.token_type).toBe('Bearer');
    });

    it('✓ mauvais mot de passe lève UnauthorizedException', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(UnauthorizedException);
      expect(cookieService.setAccessTokenCookie).not.toHaveBeenCalled();
    });

    it('✓ utilisateur inexistant lève UnauthorizedException', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow(UnauthorizedException);
      expect(cookieService.setAccessTokenCookie).not.toHaveBeenCalled();
    });

    it('✓ cookie absent en cas d\'erreur', async () => {
      authService.validateUser.mockRejectedValue(new Error('DB connection failed'));

      await expect(controller.login(loginDto, mockResponse)).rejects.toThrow('DB connection failed');
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
});
