import { Controller, Post, Body, UseGuards, Get, Request, UnauthorizedException, Delete, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoogleOAuthCallbackDto } from './dto/oauth.dto';
import { LinkProviderDto } from './dto/oauth.dto';
import { AuthProviderType } from './entities/auth-provider.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    @Throttle({ 
      default: { 
        limit: process.env.NODE_ENV === 'development' ? 100 : 5, 
        ttl: process.env.NODE_ENV === 'development' ? 60000 : 900000 
      } 
    }) // Dev: 100 tentatives/min, Prod: 5 tentatives/15min (anti-bruteforce)
    @ApiOperation({ summary: 'Login user' })
    @ApiResponse({ status: 200, description: 'Return JWT token' })
    @ApiResponse({ status: 429, description: 'Too many login attempts, please try again later' })
    async login(@Body() loginDto: LoginDto, @Request() req) {
        const user = await this.authService.validateUser(loginDto.email, loginDto.password);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }
        return this.authService.login(user, req.res);
    }

    @Post('register')
    @ApiOperation({ summary: 'Register new user' })
    @ApiResponse({ status: 201, description: 'User successfully created' })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    getProfile(@Request() req) {
        return req.user;
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
    async token(@Body() form: any) {
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
