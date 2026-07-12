import { BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

import { GoogleOAuthService } from './google-oauth.service';

type GoogleTokenResponse = {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
};

type GoogleUserInfo = {
  id: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
};

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe('GoogleOAuthService', () => {
  let service: GoogleOAuthService;
  let configService: { get: jest.Mock };

  beforeEach(() => {
    configService = { get: jest.fn() };
    service = new GoogleOAuthService(configService as unknown as ConfigService);

    mockedAxios.post.mockReset();
    mockedAxios.get.mockReset();
    mockVerifyIdToken.mockReset();
  });

  describe('exchangeCodeForTokens()', () => {
    it('should exchange a code for tokens when Google OAuth2 is configured', async () => {
      const tokenResponse: GoogleTokenResponse = {
        access_token: 'access-token',
        id_token: 'id-token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GOOGLE_CLIENT_ID':
            return 'google-client-id';
          case 'GOOGLE_CLIENT_SECRET':
            return 'google-client-secret';
          case 'GOOGLE_CALLBACK_URL':
            return 'https://example.com/callback';
          default:
            return undefined;
        }
      });

      mockedAxios.post.mockResolvedValue({ data: tokenResponse });

      const result = await service.exchangeCodeForTokens('authorization-code');

      expect(result).toEqual(tokenResponse);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
    });

    it('should throw BadRequestException when Google OAuth2 is not configured', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(service.exchangeCodeForTokens('authorization-code')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when the Google token endpoint returns an error', async () => {
      configService.get.mockImplementation((key: string) => {
        switch (key) {
          case 'GOOGLE_CLIENT_ID':
            return 'google-client-id';
          case 'GOOGLE_CLIENT_SECRET':
            return 'google-client-secret';
          case 'GOOGLE_CALLBACK_URL':
            return 'https://example.com/callback';
          default:
            return undefined;
        }
      });

      mockedAxios.post.mockRejectedValue({
        response: {
          data: {
            error_description: 'invalid_grant',
          },
        },
      });

      await expect(service.exchangeCodeForTokens('authorization-code')).rejects.toThrow(
        /invalid_grant/,
      );
    });
  });

  describe('verifyIdToken()', () => {
    it('should return verified Google payload when token is valid', async () => {
      configService.get.mockReturnValue('google-client-id');

      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: 'alice@example.com',
          sub: 'google-sub',
          email_verified: true,
        }),
      });

      const result = await service.verifyIdToken('id-token');

      expect(result).toEqual({
        email: 'alice@example.com',
        sub: 'google-sub',
        emailVerified: true,
      });
      expect(mockVerifyIdToken).toHaveBeenCalledWith({
        idToken: 'id-token',
        audience: 'google-client-id',
      });
    });

    it('should throw BadRequestException when Google OAuth2 is not configured', async () => {
      configService.get.mockReturnValue(undefined);

      await expect(service.verifyIdToken('id-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when token verification fails', async () => {
      configService.get.mockReturnValue('google-client-id');
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

      await expect(service.verifyIdToken('id-token')).rejects.toThrow(
        /Impossible de vérifier le token Google: Invalid token/,
      );
    });
  });

  describe('getUserInfo()', () => {
    it('should return user info for a valid access token', async () => {
      const userInfo: GoogleUserInfo = {
        id: 'user-id',
        email: 'alice@example.com',
        email_verified: true,
        name: 'Alice Example',
        given_name: 'Alice',
        family_name: 'Example',
        picture: 'https://example.com/avatar.png',
      };

      mockedAxios.get.mockResolvedValue({ data: userInfo });

      const result = await service.getUserInfo('access-token');

      expect(result).toEqual(userInfo);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer access-token',
          },
        }),
      );
    });
  });
});
