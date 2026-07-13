import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../services/audit.service';
import { AuthAuditEvent } from '../enums/auth-audit-event.enum';

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
 */
@Injectable()
export class CsrfGuard implements CanActivate {
    constructor(
        private readonly configService: ConfigService,
        private readonly auditService: AuditService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
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

        // Get CSRF token from cookie
        const cookieCsrfToken = request.cookies?.[csrfTokenName];

        // Get CSRF token from header
        const headerCsrfToken = request.headers['x-csrf-token'] as string | undefined;

        // Get IP and user agent for audit
        const ipAddress = request.headers['x-forwarded-for'] as string || request.ip || null;
        const userAgent = request.headers['user-agent'] || null;

        // Validate both are present
        if (!cookieCsrfToken || !headerCsrfToken) {
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

        // Validate both match
        if (cookieCsrfToken !== headerCsrfToken) {
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
