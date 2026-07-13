import { Request } from 'express';
import { ExtractJwt } from 'passport-jwt';

/**
 * Custom JWT extractor that reads from cookie first, then falls back to Bearer header
 * 
 * This maintains backward compatibility with Bearer tokens while supporting HttpOnly cookies
 * 
 * @param request - Express request object
 * @returns JWT token string or null
 */
const cookieOrBearerExtractor = (request: Request): string | null => {
  // First try to read from cookie (for HttpOnly cookie authentication)
  const authCookiesConfig = request.app?.get('ConfigService')?.get('authCookies');
  const accessTokenName = authCookiesConfig?.accessTokenName || 'access_token';
  
  if (request.cookies && request.cookies[accessTokenName]) {
    return request.cookies[accessTokenName];
  }

  // Fall back to Bearer header (for backward compatibility)
  return ExtractJwt.fromAuthHeaderAsBearerToken()(request);
};

describe('JWT Cookie/Bearer Extractor', () => {
  let mockRequest: Partial<Request>;

  beforeEach(() => {
    mockRequest = {
      cookies: {},
      headers: {},
      app: {
        get: jest.fn(),
      } as any,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cookie extraction', () => {
    it('should extract JWT from cookie when present', () => {
      const token = 'test_jwt_token_from_cookie';
      mockRequest.cookies = { access_token: token };

      const result = cookieOrBearerExtractor(mockRequest as Request);

      expect(result).toBe(token);
    });

    it('should extract JWT from custom cookie name when configured', () => {
      const token = 'test_jwt_token_from_custom_cookie';
      mockRequest.cookies = { custom_access_token: token };
      mockRequest.app = {
        get: jest.fn((key: string) => {
          if (key === 'ConfigService') {
            return {
              get: jest.fn((configKey: string) => {
                if (configKey === 'authCookies') {
                  return { accessTokenName: 'custom_access_token' };
                }
                return undefined;
              }),
            };
          }
          return undefined;
        }),
      } as any;

      const result = cookieOrBearerExtractor(mockRequest as Request);

      expect(result).toBe(token);
    });

    it('should return null when cookie is not present', () => {
      mockRequest.cookies = {};

      const result = cookieOrBearerExtractor(mockRequest as Request);

      expect(result).toBeNull();
    });
  });

  describe('Bearer token fallback', () => {
    it('should extract JWT from Bearer header when cookie is not present', () => {
      const token = 'test_jwt_token_from_bearer';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      mockRequest.cookies = {};

      const result = cookieOrBearerExtractor(mockRequest as Request);

      expect(result).toBe(token);
    });

    it('should return null when neither cookie nor Bearer header is present', () => {
      mockRequest.headers = {};
      mockRequest.cookies = {};

      const result = cookieOrBearerExtractor(mockRequest as Request);

      expect(result).toBeNull();
    });
  });

  describe('Priority (Cookie > Bearer)', () => {
    it('should prioritize cookie over Bearer header when both are present', () => {
      const cookieToken = 'test_jwt_token_from_cookie';
      const bearerToken = 'test_jwt_token_from_bearer';
      
      mockRequest.cookies = { access_token: cookieToken };
      mockRequest.headers = { authorization: `Bearer ${bearerToken}` };

      const result = cookieOrBearerExtractor(mockRequest as Request);

      expect(result).toBe(cookieToken);
      expect(result).not.toBe(bearerToken);
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed Bearer header gracefully', () => {
      mockRequest.headers = { authorization: 'InvalidFormat token' };
      mockRequest.cookies = {};

      const result = cookieOrBearerExtractor(mockRequest as Request);

      expect(result).toBeNull();
    });

    it('should handle empty cookie object', () => {
      mockRequest.cookies = {} as any;
      mockRequest.headers = {};

      const result = cookieOrBearerExtractor(mockRequest as Request);

      expect(result).toBeNull();
    });

    it('should handle missing app object', () => {
      const token = 'test_jwt_token';
      mockRequest.cookies = { access_token: token };
      mockRequest.app = undefined as any;

      const result = cookieOrBearerExtractor(mockRequest as Request);

      expect(result).toBe(token);
    });
  });
});
