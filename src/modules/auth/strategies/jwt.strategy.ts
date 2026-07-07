import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly _configService: ConfigService,
        private authService: AuthService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
