import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly _configService: ConfigService) {
        super({
            clientID: _configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: _configService.get<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: _configService.get<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        _refreshToken: string,
        profile: any,
        done: VerifyCallback,
    ): Promise<any> {
        const { id, emails, name } = profile;
        
        const user = {
            provider: 'google',
            providerUserId: id,
            email: emails[0].value,
            emailVerified: emails[0].verified,
            firstName: name.givenName,
            lastName: name.familyName,
            accessToken,
        };

        done(null, user);
    }
}
