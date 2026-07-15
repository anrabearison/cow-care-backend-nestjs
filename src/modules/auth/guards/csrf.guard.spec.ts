import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CsrfGuard } from './csrf.guard';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../services/audit.service';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;
  let configService: jest.Mocked<ConfigService>;
  let auditService: jest.Mocked<AuditService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'authCookies') {
          return {
            csrfTokenName: 'csrf_token',
          };
        }
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    auditService = {
      logEvent: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    } as unknown as jest.Mocked<Reflector>;

    guard = new CsrfGuard(configService, auditService, reflector);
  });

  const createMockContext = (
    method: string,
    cookies?: Record<string, string>,
    headers?: Record<string, string>,
  ): ExecutionContext => {
    const request = {
      method,
      cookies: cookies || {},
      headers: headers || {},
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  describe('Safe methods (GET, HEAD, OPTIONS)', () => {
    it('should allow GET requests without CSRF check', () => {
      const context = createMockContext('GET');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow HEAD requests without CSRF check', () => {
      const context = createMockContext('HEAD');
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow OPTIONS requests without CSRF check', () => {
      const context = createMockContext('OPTIONS');
      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('Mutable methods (POST, PUT, PATCH, DELETE)', () => {
    it('should allow POST with matching CSRF cookie and header', () => {
      const csrfToken = 'test-csrf-token';
      const context = createMockContext('POST', { csrf_token: csrfToken }, { 'x-csrf-token': csrfToken });
      
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow PUT with matching CSRF cookie and header', () => {
      const csrfToken = 'test-csrf-token';
      const context = createMockContext('PUT', { csrf_token: csrfToken }, { 'x-csrf-token': csrfToken });
      
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow PATCH with matching CSRF cookie and header', () => {
      const csrfToken = 'test-csrf-token';
      const context = createMockContext('PATCH', { csrf_token: csrfToken }, { 'x-csrf-token': csrfToken });
      
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow DELETE with matching CSRF cookie and header', () => {
      const csrfToken = 'test-csrf-token';
      const context = createMockContext('DELETE', { csrf_token: csrfToken }, { 'x-csrf-token': csrfToken });
      
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should reject POST with missing CSRF cookie', () => {
      const context = createMockContext('POST', {}, { 'x-csrf-token': 'test-token' });
      
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
    });

    it('should reject POST with missing CSRF header', () => {
      const context = createMockContext('POST', { csrf_token: 'test-token' }, {});
      
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
    });

    it('should reject POST with mismatched CSRF tokens', () => {
      const context = createMockContext('POST', { csrf_token: 'cookie-token' }, { 'x-csrf-token': 'header-token' });
      
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('CSRF token mismatch');
    });

    it('should reject PUT with missing both cookie and header', () => {
      const context = createMockContext('PUT', {}, {});
      
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
    });

    it('should reject PATCH with empty CSRF cookie', () => {
      const context = createMockContext('PATCH', { csrf_token: '' }, { 'x-csrf-token': 'test-token' });
      
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
    });

    it('should reject DELETE with empty CSRF header', () => {
      const context = createMockContext('DELETE', { csrf_token: 'test-token' }, { 'x-csrf-token': '' });
      
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
    });
  });

  describe('Custom CSRF token name', () => {
    beforeEach(() => {
      configService = {
        get: jest.fn((key: string) => {
          if (key === 'authCookies') {
            return {
              csrfTokenName: 'custom_csrf',
            };
          }
          return undefined;
        }),
      } as unknown as jest.Mocked<ConfigService>;

      auditService = {
        logEvent: jest.fn().mockResolvedValue(undefined),
      } as unknown as jest.Mocked<AuditService>;

      reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      } as unknown as jest.Mocked<Reflector>;

      guard = new CsrfGuard(configService, auditService, reflector);
    });

    it('should use custom CSRF token name from config', () => {
      const csrfToken = 'test-csrf-token';
      const context = createMockContext('POST', { custom_csrf: csrfToken }, { 'x-csrf-token': csrfToken });
      
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should reject when custom token name cookie is missing', () => {
      const context = createMockContext('POST', { csrf_token: 'test-token' }, { 'x-csrf-token': 'test-token' });
      
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });
});
