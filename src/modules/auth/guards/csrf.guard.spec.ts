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
            accessTokenName: 'access_token',
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

  /**
   * Helper pour créer un contexte de requête simulé.
   *
   * @param method     HTTP method (GET, POST, PUT, PATCH, DELETE…)
   * @param cookies    Cookies supplémentaires à injecter dans la requête
   * @param headers    Headers HTTP de la requête
   * @param options    cookieAuthenticated (true par défaut) — quand true, injecte un cookie
   *                   access_token simulant une session active (flux de production).
   *                   Quand false, aucun cookie access_token n'est ajouté automatiquement,
   *                   simulant une requête Bearer-only.
   */
  const createMockContext = (
    method: string,
    cookies?: Record<string, string>,
    headers?: Record<string, string>,
    options: { cookieAuthenticated?: boolean } = {},
  ): ExecutionContext => {
    const { cookieAuthenticated = true } = options;

    // Par défaut, on simule une session cookie active (access_token présent)
    const baseCookies: Record<string, string> = cookieAuthenticated
      ? { access_token: 'mock-access-token-value' }
      : {};

    const request = {
      method,
      cookies: { ...baseCookies, ...(cookies || {}) },
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
              accessTokenName: 'access_token',
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

  describe('Bearer-only authentication (no access_token cookie)', () => {
    it('should allow POST without access_token cookie and only Authorization Bearer header — Bearer-only requests are immune to CSRF by nature', () => {
      // Requête authentifiée uniquement par Bearer — pas de cookie access_token
      // Le navigateur ne peut pas forger ce type de requête cross-site
      const context = createMockContext(
        'POST',
        {}, // pas de csrf_token ni access_token
        { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.test.sig' },
        { cookieAuthenticated: false },
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow DELETE without any cookie (no access_token, no csrf_token) and no CSRF header — non-cookie session bypasses CSRF check', () => {
      // Requête sans aucun cookie : impossible à exploiter via CSRF
      const context = createMockContext(
        'DELETE',
        {}, // aucun cookie
        {}, // aucun header CSRF
        { cookieAuthenticated: false },
      );

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should still enforce CSRF check when access_token cookie is present, even if Authorization Bearer header is also set — mixed auth must not bypass CSRF', () => {
      // access_token présent → le guard CSRF reste actif même si Bearer est aussi présent
      // Le double submit cookie pattern doit s'appliquer dans ce cas
      const context = createMockContext(
        'POST',
        { access_token: 'mock-jwt' }, // cookie présent → isCookieAuthenticated = true
        {
          authorization: 'Bearer mock-jwt',
          // pas de X-CSRF-Token ni de csrf_token cookie
        },
        { cookieAuthenticated: false }, // cookieAuthenticated: false évite d'ajouter un 2e access_token
      );

      // Le guard doit lever ForbiddenException car csrf_token est absent malgré access_token présent
      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow('CSRF token missing');
    });
  });
});
