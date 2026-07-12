import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

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
    private readonly oauthClient: OAuth2Client;

    constructor(private configService: ConfigService) {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        this.oauthClient = new OAuth2Client(clientId);
    }

    async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
        const redirectUri = this.configService.get<string>('GOOGLE_CALLBACK_URL');

        if (!clientId || !clientSecret || !redirectUri) {
            throw new BadRequestException("Google OAuth2 n'est pas configuré");
        }

        try {
            const params = new URLSearchParams();
            params.append('code', code);
            params.append('client_id', clientId);
            params.append('client_secret', clientSecret);
            params.append('redirect_uri', redirectUri);
            params.append('grant_type', 'authorization_code');

            const response = await axios.post('https://oauth2.googleapis.com/token', params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });

            return response.data;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.error_description || error?.response?.data?.error || "Erreur lors de l'échange du code Google";
            throw new BadRequestException(`Google OAuth2 token exchange failed: ${errorMessage}`);
        }
    }

    async verifyIdToken(idToken: string): Promise<{ email: string; sub: string; emailVerified: boolean }> {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

        if (!clientId) {
            throw new BadRequestException("Google OAuth2 n'est pas configuré");
        }

        try {
            const ticket = await this.oauthClient.verifyIdToken({
                idToken,
                audience: clientId,
            });

            const payload = ticket.getPayload();

            if (!payload?.email || !payload?.sub) {
                throw new BadRequestException('Token Google invalide');
            }

            return {
                email: payload.email,
                sub: payload.sub,
                emailVerified: payload.email_verified || false,
            };
        } catch (error: any) {
            const message = error?.message || 'Impossible de vérifier le token Google';
            throw new BadRequestException(`Impossible de vérifier le token Google: ${message}`);
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
}
