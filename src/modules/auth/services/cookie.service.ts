import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { randomBytes } from 'crypto';

/**
 * Cookie options interface for type safety
 */
export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
  path: string;
  maxAge: number;
}

/**
 * Cookie names interface for type safety
 */
export interface CookieNames {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

/**
 * Service responsible for centralizing cookie management
 * 
 * This service provides a single source of truth for cookie configuration
 * and ensures consistency across all cookie operations.
 * 
 * @example
 * ```typescript
 * constructor(private cookieService: CookieService) {}
 * 
 * // Set access token cookie
 * this.cookieService.setAccessTokenCookie(response, token);
 * 
 * // Clear access token cookie
 * this.cookieService.clearAccessTokenCookie(response);
 * ```
 */
@Injectable()
export class CookieService {
  private readonly cookieNames: CookieNames;
  private readonly baseOptions: CookieOptions;

  constructor(private readonly configService: ConfigService) {
    const authCookiesConfig = this.configService.get('authCookies');
    
    this.cookieNames = {
      accessToken: authCookiesConfig.accessTokenName,
      refreshToken: authCookiesConfig.refreshTokenName,
      csrfToken: authCookiesConfig.csrfTokenName || 'csrf_token',
    };

    this.baseOptions = {
      httpOnly: true,
      secure: authCookiesConfig.secure,
      sameSite: authCookiesConfig.sameSite,
      domain: authCookiesConfig.domain,
      path: authCookiesConfig.path,
      maxAge: authCookiesConfig.maxAge,
    };
  }

  /**
   * Get cookie names configuration
   * 
   * @returns Object containing access token and refresh token cookie names
   */
  getCookieNames(): CookieNames {
    return this.cookieNames;
  }

  /**
   * Get base cookie options
   * 
   * @returns Base cookie options object
   */
  getBaseOptions(): CookieOptions {
    return { ...this.baseOptions };
  }

  /**
   * Set access token cookie
   * 
   * @param response - Express response object
   * @param token - JWT access token
   */
  setAccessTokenCookie(response: Response, token: string): void {
    response.cookie(this.cookieNames.accessToken, token, this.baseOptions);
  }

  /**
   * Set refresh token cookie
   * 
   * @param response - Express response object
   * @param token - JWT refresh token
   * @param maxAge - Optional custom max age for refresh token (usually longer than access token)
   */
  setRefreshTokenCookie(response: Response, token: string, maxAge?: number): void {
    const options = { ...this.baseOptions };
    if (maxAge) {
      options.maxAge = maxAge;
    }
    response.cookie(this.cookieNames.refreshToken, token, options);
  }

  /**
   * Clear access token cookie
   * 
   * @param response - Express response object
   */
  clearAccessTokenCookie(response: Response): void {
    response.clearCookie(this.cookieNames.accessToken, {
      ...this.baseOptions,
      maxAge: 0,
    });
  }

  /**
   * Clear refresh token cookie
   * 
   * @param response - Express response object
   */
  clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(this.cookieNames.refreshToken, {
      ...this.baseOptions,
      maxAge: 0,
    });
  }

  /**
   * Clear all authentication cookies
   * 
   * @param response - Express response object
   */
  clearAllAuthCookies(response: Response): void {
    this.clearAccessTokenCookie(response);
    this.clearRefreshTokenCookie(response);
    this.clearCsrfCookie(response);
  }

  /**
   * Generate a random CSRF token
   * 
   * @returns Random 32-byte hex string
   */
  generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Set CSRF token cookie
   * 
   * Unlike other auth cookies, this cookie is NOT HttpOnly so the frontend can read it.
   * 
   * @param response - Express response object
   * @param token - CSRF token (if not provided, a new one will be generated)
   */
  setCsrfCookie(response: Response, token?: string): void {
    const csrfToken = token || this.generateCsrfToken();
    
    // CSRF cookie is NOT HttpOnly so frontend can read it
    const csrfOptions: CookieOptions = {
      ...this.baseOptions,
      httpOnly: false,
      path: '/',
    };
    
    response.cookie(this.cookieNames.csrfToken, csrfToken, csrfOptions);
  }

  /**
   * Clear CSRF token cookie
   * 
   * @param response - Express response object
   */
  clearCsrfCookie(response: Response): void {
    const csrfOptions: CookieOptions = {
      ...this.baseOptions,
      httpOnly: false,
      path: '/',
      maxAge: 0,
    };
    
    response.clearCookie(this.cookieNames.csrfToken, csrfOptions);
  }

  /**
   * Get custom cookie options with overrides
   * 
   * @param overrides - Partial cookie options to override defaults
   * @returns Cookie options with applied overrides
   */
  getCustomOptions(overrides: Partial<CookieOptions>): CookieOptions {
    return {
      ...this.baseOptions,
      ...overrides,
    };
  }
}
