import { Controller, Post, Body, UseGuards, Get, Request, Res, UnauthorizedException, Delete, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CurrentUserDto } from './dto/current-user.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoogleOAuthCallbackDto } from './dto/oauth.dto';
import { LinkProviderDto } from './dto/oauth.dto';
import { AuthProviderType } from './entities/auth-provider.entity';
import { CookieService } from './services/cookie.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private cookieService: CookieService,
    ) { }

    @Post('login')
    @Throttle({ 
      default: { 
        limit: process.env.NODE_ENV === 'development' ? 100 : 5, 
        ttl: process.env.NODE_ENV === 'development' ? 60000 : 900000 
      } 
    }) // Dev: 100 tentatives/min, Prod: 5 tentatives/15min (anti-bruteforce)
    @ApiOperation({
        summary: 'Login user',
        description: 'Authenticates a user with email and password. '
            + 'On success, sets an HttpOnly authentication cookie and returns user information. '
            + 'The access_token field in the response body is temporarily kept for backward '
            + 'compatibility and will be removed in a future version.',
    })
    @ApiResponse({
        status: 201,
        description: 'User authenticated. An HttpOnly cookie is set with the JWT. '
            + 'The access_token in the response body is deprecated and will be removed.',
        type: LoginResponseDto,
    })
    @ApiResponse({ status: 401, description: 'Invalid credentials' })
    @ApiResponse({ status: 429, description: 'Too many login attempts, please try again later' })
    async login(
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResponseDto> {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        const result = await this.authService.login(user);
        this.cookieService.setAccessTokenCookie(res, result.access_token);
        return result;
    }

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({ status: 201, description: 'User successfully created' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ 
        summary: 'Retourne l\'utilisateur associé à la session courante.',
        description: 'Récupère les informations de l\'utilisateur connecté à partir du cookie HttpOnly (comportement recommandé) ou du Bearer Token (compatibilité temporaire). '
            + 'Cette route lit uniquement la session courante. Elle ne renouvelle pas le token et ne modifie pas les cookies.',
    })
    @ApiResponse({ 
        status: 200, 
        description: 'Session valide, informations de l\'utilisateur renvoyées.',
        type: CurrentUserDto
    })
    @ApiResponse({ status: 401, description: 'Non authentifié ou utilisateur désactivé/inexistant' })
    async getSessionUser(@Request() req): Promise<CurrentUserDto> {
        return this.authService.getCurrentUser(req.user.id);
    }

    // Endpoint for OAuth2 compatibility (Swagger UI)
    @Post('token')
    @Throttle({ 
      default: { 
        limit: process.env.NODE_ENV === 'development' ? 100 : 5, 
        ttl: process.env.NODE_ENV === 'development' ? 60000 : 900000 
      } 
    }) // Dev: 100 tentatives/min, Prod: 5 tentatives/15min (anti-bruteforce)
    @ApiOperation({ summary: 'Login for Swagger UI' })
    @ApiResponse({ status: 429, description: 'Too many login attempts, please try again later' })
    async token(@Body() form: Record<string, string>) {
        // Handle form-urlencoded data if needed, or just reuse login logic
        // For simplicity reusing login logic but mapping fields
        const email = form.username || form.email;
        const password = form.password;

        const user = await this.authService.validateUser(email, password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user);
    }

    @Post('google')
    @ApiOperation({ summary: 'Login with Google OAuth2' })
    @ApiResponse({ status: 200, description: 'Return JWT token' })
    async loginWithGoogle(@Body() dto: GoogleOAuthCallbackDto) {
        return this.authService.loginWithGoogle(dto.code, dto.state);
    }

    @UseGuards(JwtAuthGuard)
    @Post('google/link')
    @ApiOperation({ summary: 'Link Google account to existing user' })
    @ApiResponse({ status: 200, description: 'Google account linked successfully' })
    async linkGoogleAccount(@Request() req, @Body() dto: LinkProviderDto) {
        return this.authService.linkGoogleAccount(req.user.id, dto.code);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('providers/:provider')
    @ApiOperation({ summary: 'Unlink a provider from user account' })
    @ApiResponse({ status: 200, description: 'Provider unlinked successfully' })
    async unlinkProvider(@Request() req, @Param('provider') provider: AuthProviderType) {
        return this.authService.unlinkProvider(req.user.id, provider);
    }

    @UseGuards(JwtAuthGuard)
    @Get('providers')
    @ApiOperation({ summary: 'Get user linked providers' })
    @ApiResponse({ status: 200, description: 'Return list of linked providers' })
    async getUserProviders(@Request() req) {
        return this.authService.getUserProviders(req.user.id);
    }

    @Post('refresh')
    @ApiOperation({ summary: 'Refresh access token using refresh token' })
    @ApiResponse({ status: 200, description: 'Return new access token' })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    async refresh(@Request() req) {
        return this.authService.refreshToken();
    }

    @Post('logout')
    @ApiOperation({ summary: 'Logout user and invalidate session' })
    @ApiResponse({ status: 200, description: 'Logout successful' })
    async logout(@Request() req) {
        return this.authService.logout(req.res);
    }
}
