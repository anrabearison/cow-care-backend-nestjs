import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { AuditService } from '../services/audit.service';
import { AuthAuditEvent } from '../enums/auth-audit-event.enum';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';

/**
 * CSRF Guard for protecting mutable endpoints
 * 
 * Implements Double Submit Cookie pattern:
 * - Reads CSRF token from cookie
 * - Reads CSRF token from X-CSRF-Token header
 * - Compares both values
 * - Returns 403 if missing or mismatched
 * 
 * Applied to POST, PUT, PATCH, DELETE methods
 * GET, HEAD, OPTIONS are exempted
 * 
 * Registered as a global APP_GUARD. Use @SkipCsrf() decorator
 * to exempt specific routes (e.g., login, register).
 */
@Injectable()
export class CsrfGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
        private readonly auditService: AuditService,
        private readonly reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        // Check for @SkipCsrf() decorator on handler or class
        const skipCsrf = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (skipCsrf) {
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const method = request.method;

        // Exempt safe methods
        if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
            return true;
        }

        // Only protect mutable methods
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            return true;
        }

        const authCookiesConfig = this.configService.get('authCookies');
        const csrfTokenName = authCookiesConfig?.csrfTokenName || 'csrf_token';
        const accessTokenName = authCookiesConfig?.accessTokenName || 'access_token';

        const isCookieAuthenticated = !!request.cookies?.[accessTokenName];

        // Une requête authentifiée uniquement via Authorization: Bearer (sans cookie access_token)
        // n'est pas vulnérable au CSRF par nature.
        const hasBearerHeader = !!request.headers.authorization && request.headers.authorization.startsWith('Bearer ');
        if (!isCookieAuthenticated && hasBearerHeader) {
            return true;
        }

        if (!isCookieAuthenticated) {
            return true;
        }

        // Get CSRF token from cookie
        const cookieCsrfToken = request.cookies?.[csrfTokenName];

        // Get CSRF token from header
        const headerCsrfToken = request.headers['x-csrf-token'] as string | undefined;

        // Si le cookie d'accès est présent mais qu'aucun cookie CSRF n'a pu être lu côté client
        // en raison du statut Cross-Site (ex: Vercel -> Railway avec cookies SameSite=None), 
        // l'en-tête X-CSRF-Token ou la validation du jeton est acceptée si un CSRF header valide est soumis 
        // ou si la requête provient d'une origine de confiance autorisée dans CORS.
        const origin = request.headers.origin as string | undefined;
        const corsOriginsRaw = process.env.CORS_ORIGINS || '';
        const allowedOrigins = [
            'https://ankijaniko.vercel.app',
            'http://localhost:5173',
            'http://localhost:8085',
            'http://localhost:3000',
            ...corsOriginsRaw.split(',').map(o => o.trim()).filter(Boolean),
        ];
        const isTrustedOrigin = !!origin && (allowedOrigins.includes(origin) || corsOriginsRaw.includes('*') || /\.vercel\.app$/.test(origin));

        // Get IP and user agent for audit
        const ipAddress = (request.headers['x-forwarded-for'] as string) || request.ip || null;
        const userAgent = request.headers['user-agent'] || null;

        // Validation standard si le token CSRF est fourni
        if (!cookieCsrfToken || !headerCsrfToken) {
            if (isTrustedOrigin) {
                // Origine de confiance autorisée — exemptée de blocage CSRF strict
                return true;
            }

            // Log CSRF failure
            this.auditService.logEvent({
                email: 'unknown',
                eventType: AuthAuditEvent.CSRF_FAILURE,
                ipAddress,
                userAgent,
                success: false,
                failureReason: !cookieCsrfToken ? 'CSRF cookie missing' : 'CSRF header missing',
            }).catch(() => {
                // Ignore audit errors
            });

            throw new ForbiddenException('CSRF token missing');
        }

        // Validate both match using constant-time comparison to prevent timing attacks
        const cookieBuffer = Buffer.from(cookieCsrfToken);
        const headerBuffer = Buffer.from(headerCsrfToken);

        if (cookieBuffer.length !== headerBuffer.length || !timingSafeEqual(cookieBuffer, headerBuffer)) {
            // Log CSRF failure
            this.auditService.logEvent({
                email: 'unknown',
                eventType: AuthAuditEvent.CSRF_FAILURE,
                ipAddress,
                userAgent,
                success: false,
                failureReason: 'CSRF token mismatch',
            }).catch(() => {
                // Ignore audit errors
            });

            throw new ForbiddenException('CSRF token mismatch');
        }

        return true;
    }
}
