import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../users/entities/user.entity';
import { AuthProvider } from './entities/auth-provider.entity';
import { Invitation } from './entities/invitation.entity';
import { RefreshSession } from './entities/refresh-session.entity';
import { AuthAuditLog } from './entities/auth-audit-log.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';
import { AuthProviderService } from './services/auth-provider.service';
import { InvitationService } from './services/invitation.service';
import { GoogleOAuthService } from './services/google-oauth.service';
import { CookieService } from './services/cookie.service';
import { AuditService } from './services/audit.service';
import { CommonModule } from '../../common/common.module';
import { InvitationController } from './controllers/invitation.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, AuthProvider, Invitation, RefreshSession, AuthAuditLog]),
        PassportModule,
        CommonModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('security.secretKey'),
                signOptions: {
                    expiresIn: `${configService.get<number>('security.accessTokenExpireMinutes')}m`
                },
            }),
            inject: [ConfigService],
        }),
    ],
    providers: [
        AuthService,
        JwtStrategy,
        GoogleOAuthStrategy,
        AuthProviderService,
        InvitationService,
        GoogleOAuthService,
        CookieService,
        AuditService,
    ],
    controllers: [AuthController, InvitationController],
    exports: [AuthService, AuthProviderService, InvitationService, CookieService, AuditService],
})
export class AuthModule { }
