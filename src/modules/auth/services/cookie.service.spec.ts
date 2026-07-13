import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { CookieService, CookieOptions, CookieNames } from './cookie.service';

describe('CookieService', () => {
  let service: CookieService;
  let configService: jest.Mocked<ConfigService>;
  let mockResponse: jest.Mocked<Response>;

  beforeEach(async () => {
    const mockConfig = {
      authCookies: {
        accessTokenName: 'access_token',
        refreshTokenName: 'refresh_token',
        csrfTokenName: 'csrf_token',
        secure: true,
        sameSite: 'lax' as const,
        domain: '.example.com',
        path: '/',
        maxAge: 30 * 60 * 1000, // 30 minutes
      },
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'authCookies') {
          return mockConfig.authCookies;
        }
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    mockResponse = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<Response>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CookieService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<CookieService>(CookieService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCookieNames', () => {
    it('should return correct cookie names', () => {
      const names = service.getCookieNames();
      
      expect(names).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
        csrfToken: 'csrf_token',
      });
    });
  });

  describe('getBaseOptions', () => {
    it('should return correct base options', () => {
      const options = service.getBaseOptions();
      
      expect(options).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: '.example.com',
        path: '/',
        maxAge: 30 * 60 * 1000,
      });
    });

    it('should return a copy of options (not reference)', () => {
      const options1 = service.getBaseOptions();
      const options2 = service.getBaseOptions();
      
      expect(options1).not.toBe(options2);
    });
  });

  describe('setAccessTokenCookie', () => {
    it('should set access token cookie with correct options', () => {
      const token = 'test_access_token';
      
      service.setAccessTokenCookie(mockResponse, token);
      
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        token,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          domain: '.example.com',
          path: '/',
          maxAge: 30 * 60 * 1000,
        }),
      );
    });
  });

  describe('setRefreshTokenCookie', () => {
    it('should set refresh token cookie with default max age', () => {
      const token = 'test_refresh_token';
      
      service.setRefreshTokenCookie(mockResponse, token);
      
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        token,
        expect.objectContaining({
          maxAge: 30 * 60 * 1000,
        }),
      );
    });

    it('should set refresh token cookie with custom max age', () => {
      const token = 'test_refresh_token';
      const customMaxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      service.setRefreshTokenCookie(mockResponse, token, customMaxAge);
      
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        token,
        expect.objectContaining({
          maxAge: customMaxAge,
        }),
      );
    });
  });

  describe('clearAccessTokenCookie', () => {
    it('should clear access token cookie with maxAge 0', () => {
      service.clearAccessTokenCookie(mockResponse);
      
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({
          maxAge: 0,
        }),
      );
    });
  });

  describe('clearRefreshTokenCookie', () => {
    it('should clear refresh token cookie with maxAge 0', () => {
      service.clearRefreshTokenCookie(mockResponse);
      
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          maxAge: 0,
        }),
      );
    });
  });

  describe('clearAllAuthCookies', () => {
    it('should clear both access and refresh token cookies with exactly the same attributes as creation (except maxAge: 0)', () => {
      service.clearAllAuthCookies(mockResponse);
      
      const expectedOptions = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: '.example.com',
        path: '/',
        maxAge: 0,
      };

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(3);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token', expectedOptions);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', expectedOptions);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('csrf_token', expect.objectContaining({
        httpOnly: false,
        path: '/',
        maxAge: 0,
      }));
    });
  });

  describe('generateCsrfToken', () => {
    it('should generate a random 32-byte hex string', () => {
      const token = service.generateCsrfToken();
      
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64); // 32 bytes * 2 hex chars per byte
      expect(/^[0-9a-f]{64}$/.test(token)).toBe(true);
    });

    it('should generate different tokens on each call', () => {
      const token1 = service.generateCsrfToken();
      const token2 = service.generateCsrfToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('setCsrfCookie', () => {
    it('should set CSRF cookie with httpOnly=false', () => {
      const token = 'test_csrf_token';
      
      service.setCsrfCookie(mockResponse, token);
      
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf_token',
        token,
        expect.objectContaining({
          httpOnly: false,
          secure: true,
          sameSite: 'lax',
          domain: '.example.com',
          path: '/',
        })
      );
    });

    it('should generate token if not provided', () => {
      service.setCsrfCookie(mockResponse);
      
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.stringMatching(/^[0-9a-f]{64}$/),
        expect.any(Object)
      );
    });
  });

  describe('clearCsrfCookie', () => {
    it('should clear CSRF cookie with correct options', () => {
      service.clearCsrfCookie(mockResponse);
      
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'csrf_token',
        expect.objectContaining({
          httpOnly: false,
          path: '/',
          maxAge: 0,
        })
      );
    });
  });

  describe('getCustomOptions', () => {
    it('should return options with custom overrides', () => {
      const overrides: Partial<CookieOptions> = {
        secure: false,
        maxAge: 60 * 1000, // 1 minute
      };
      
      const options = service.getCustomOptions(overrides);
      
      expect(options).toEqual({
        httpOnly: true,
        secure: false, // overridden
        sameSite: 'lax',
        domain: '.example.com',
        path: '/',
        maxAge: 60 * 1000, // overridden
      });
    });

    it('should not modify base options when applying overrides', () => {
      const baseOptionsBefore = service.getBaseOptions();
      
      service.getCustomOptions({ secure: false });
      
      const baseOptionsAfter = service.getBaseOptions();
      
      expect(baseOptionsAfter).toEqual(baseOptionsBefore);
      expect(baseOptionsAfter.secure).toBe(true);
    });
  });
});
