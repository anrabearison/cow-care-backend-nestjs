import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

/**
 * Decorator to add X-CSRF-Token header documentation to Swagger / OpenAPI specs
 * for mutable endpoints that are protected by CsrfGuard.
 */
export function ApiCsrfHeader() {
  return applyDecorators(
    ApiHeader({
      name: 'X-CSRF-Token',
      description: 'CSRF protection token (must match the csrf_token cookie value for cookie-authenticated sessions)',
      required: false,
    }),
  );
}
