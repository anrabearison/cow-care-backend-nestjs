import { Controller, Post, Body, UseGuards, Get, Request, Res, UnauthorizedException, Delete, Param, HttpCode, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response, Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SessionDto } from './dto/session.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CurrentUserDto } from './dto/current-user.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoogleOAuthCallbackDto } from './dto/oauth.dto';
import { LinkProviderDto } from './dto/oauth.dto';
import { AuthProviderType } from './entities/auth-provider.entity';
import { CookieService } from './services/cookie.service';
import { SkipCsrf } from './decorators/skip-csrf.decorator';

@ApiTags('Platform - Auth')
@Controller('platform/auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private cookieService: CookieService,
    ) { }

    @SkipCsrf()
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
        @Req() req: ExpressRequest,
        @Body() loginDto: LoginDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResponseDto> {
        const ipAddress = req.headers['x-forwarded-for'] as string || req.ip || null;
        const userAgent = req.headers['user-agent'] || null;

        const user = await this.authService.validateUser(loginDto.email, loginDto.password, { ipAddress, userAgent });
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        
        const { refresh_token, ...result } = await this.authService.login(user, { ipAddress, userAgent });
        
        this.cookieService.setAccessTokenCookie(res, result.access_token);
        this.cookieService.setRefreshTokenCookie(res, refresh_token);
        this.cookieService.setCsrfCookie(res);
        
        return result;
    }

    @SkipCsrf()
    @Post('refresh')
    @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 tentatives / 15 minutes par IP
    @HttpCode(204)
    @ApiOperation({ summary: 'Refresh authentication tokens' })
    @ApiResponse({ status: 204, description: 'Tokens successfully refreshed via HttpOnly cookies. No content returned.' })
    @ApiResponse({ status: 401, description: 'Invalid or missing refresh token' })
    @ApiResponse({ status: 429, description: 'Too many refresh attempts, please try again later' })
    async refreshTokens(
        @Req() req: ExpressRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<void> {
        const cookieNames = this.cookieService.getCookieNames();
        const refreshToken = req.cookies?.[cookieNames.refreshToken];

        if (!refreshToken) {
            throw new UnauthorizedException('Refresh token missing');
        }

        const ipAddress = req.headers['x-forwarded-for'] as string || req.ip || null;
        const userAgent = req.headers['user-agent'] || null;

        const tokens = await this.authService.refreshTokens(refreshToken, { ipAddress, userAgent });

        this.cookieService.setAccessTokenCookie(res, tokens.access_token);
        this.cookieService.setRefreshTokenCookie(res, tokens.refresh_token);
        this.cookieService.setCsrfCookie(res);
    }

    @SkipCsrf()
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
    @ApiResponse({ status: 403, description: 'CSRF token missing or invalid' })
    async getSessionUser(@Request() req): Promise<CurrentUserDto> {
        return this.authService.getCurrentUser(req.user.id);
    }

    // Endpoint for OAuth2 compatibility (Swagger UI)
    @SkipCsrf()
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

    @SkipCsrf()
    @Post('google')
    @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 tentatives / 15 minutes par IP
    @ApiOperation({ 
        summary: 'Login with Google OAuth2',
        description: 'Authenticates a user via Google OAuth2. '
            + 'On success, sets HttpOnly authentication cookies (access_token and refresh_token) '
            + 'and returns user information. The access_token field in the response body is '
            + 'temporarily kept for backward compatibility and will be removed in a future version.',
    })
    @ApiResponse({
        status: 200,
        description: 'User authenticated. HttpOnly cookies are set with the JWT. '
            + 'The access_token in the response body is deprecated and will be removed.',
        type: LoginResponseDto,
    })
    @ApiResponse({ status: 429, description: 'Too many login attempts, please try again later' })
    async loginWithGoogle(
        @Req() req: ExpressRequest,
        @Body() dto: GoogleOAuthCallbackDto,
        @Res({ passthrough: true }) res: Response,
    ): Promise<LoginResponseDto> {
        const ipAddress = req.headers['x-forwarded-for'] as string || req.ip || null;
        const userAgent = req.headers['user-agent'] || null;

        const { refresh_token, ...result } = await this.authService.loginWithGoogle(dto.code, dto.state, { ipAddress, userAgent });
        
        this.cookieService.setAccessTokenCookie(res, result.access_token);
        this.cookieService.setRefreshTokenCookie(res, refresh_token);
        this.cookieService.setCsrfCookie(res);
        
        return result;
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
    @HttpCode(204)
    @ApiOperation({ summary: 'Logout user and invalidate session' })
    @ApiResponse({ status: 204, description: 'Logout successful' })
    @ApiResponse({ status: 401, description: 'Not authenticated' })
    @ApiResponse({ status: 403, description: 'CSRF token missing or invalid' })
    async logout(
        @Req() req: ExpressRequest,
        @Res({ passthrough: true }) res: Response,
    ): Promise<void> {
        const cookieNames = this.cookieService.getCookieNames();
        const refreshToken = req.cookies?.[cookieNames.refreshToken];

        const ipAddress = req.headers['x-forwarded-for'] as string || req.ip || null;
        const userAgent = req.headers['user-agent'] || null;

        await this.authService.logout(refreshToken, { ipAddress, userAgent });

        this.cookieService.clearAllAuthCookies(res);
    }

    @UseGuards(JwtAuthGuard)
    @Get('sessions')
    @ApiOperation({ summary: 'List user sessions' })
    @ApiResponse({ status: 200, description: 'Return list of active sessions', type: [SessionDto] })
    async getSessions(@Req() req: ExpressRequest) {
        const cookieNames = this.cookieService.getCookieNames();
        const refreshToken = req.cookies?.[cookieNames.refreshToken];
        const currentSessionId = this.authService.getSessionIdFromToken(refreshToken);
        
        return this.authService.getSessions((req as any).user.id, currentSessionId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('sessions/:id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a specific session' })
    @ApiResponse({ status: 204, description: 'Session deleted' })
    @ApiResponse({ status: 404, description: 'Session not found' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    async deleteSession(
        @Req() req: ExpressRequest,
        @Res({ passthrough: true }) res: Response,
        @Param('id') id: string
    ) {
        const cookieNames = this.cookieService.getCookieNames();
        const refreshToken = req.cookies?.[cookieNames.refreshToken];
        const currentSessionId = this.authService.getSessionIdFromToken(refreshToken);

        await this.authService.deleteSession((req as any).user.id, id);

        if (id === currentSessionId) {
            this.cookieService.clearAllAuthCookies(res);
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete('sessions')
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete all other sessions' })
    @ApiResponse({ status: 204, description: 'All other sessions deleted' })
    async deleteAllOtherSessions(@Req() req: ExpressRequest) {
        const cookieNames = this.cookieService.getCookieNames();
        const refreshToken = req.cookies?.[cookieNames.refreshToken];
        const currentSessionId = this.authService.getSessionIdFromToken(refreshToken);

        await this.authService.deleteAllOtherSessions((req as any).user.id, currentSessionId);
    }
}
