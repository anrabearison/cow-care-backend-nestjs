import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/**
 * Decorator to skip CSRF validation on specific routes or controllers.
 * 
 * Use on public auth routes (login, register, OAuth) that don't have
 * a CSRF cookie yet.
 * 
 * @example
 * @SkipCsrf()
 * @Post('login')
 * async login() { ... }
 */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
