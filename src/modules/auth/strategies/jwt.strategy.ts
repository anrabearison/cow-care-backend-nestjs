import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { Request } from 'express';

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

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly _configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: cookieOrBearerExtractor,
            ignoreExpiration: false,
            secretOrKey: _configService.get<string>('security.secretKey'),
        });
    }

    async validate(payload: { sub: string; id: string; role: string; ownerId?: string }) {
        const user = await this.authService.resolveUserFromJwtSubject(payload.sub);
        if (!user) {
            throw new UnauthorizedException();
        }
        // S'assurer que ownerId est présent
        if (!user.ownerId && payload.ownerId) {
            user.ownerId = payload.ownerId;
        }
        return user;
    }
}
