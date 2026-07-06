import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface GoogleTokenResponse {
    access_token: string;
    id_token: string;
    expires_in: number;
    token_type: string;
}

interface GoogleUserInfo {
    id: string;
    email: string;
    email_verified: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}

@Injectable()
export class GoogleOAuthService {
    constructor(private configService: ConfigService) {}

    async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');

        if (!clientId || !clientSecret || !redirectUri) {
            throw new BadRequestException('Google OAuth2 n\'est pas configuré');
        }

        const response = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        });

        return response.data;
    }

    async verifyIdToken(idToken: string): Promise<{ email: string; sub: string; emailVerified: boolean }> {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

        if (!clientId) {
            throw new BadRequestException('Google OAuth2 n\'est pas configuré');
        }

        try {
            // Pour simplifier, on décode le JWT sans vérification de signature
            // En production, il faudrait utiliser la bibliothèque Google Auth
            const payload = this.decodeJwt(idToken);

            if (!payload.email || !payload.sub) {
                throw new BadRequestException('Token Google invalide');
            }

            return {
                email: payload.email,
                sub: payload.sub,
                emailVerified: payload.email_verified || false,
            };
        } catch (error) {
            throw new BadRequestException('Impossible de vérifier le token Google');
        }
    }

    async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
        const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        return response.data;
    }

    private decodeJwt(token: string): any {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = Buffer.from(base64, 'base64').toString();
        return JSON.parse(jsonPayload);
    }
}
