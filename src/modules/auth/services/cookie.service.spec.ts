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
    it('should clear both access and refresh token cookies', () => {
      service.clearAllAuthCookies(mockResponse);
      
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'access_token',
        expect.objectContaining({ maxAge: 0 }),
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({ maxAge: 0 }),
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
