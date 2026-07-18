import {BadRequestException, Injectable, UnauthorizedException, NotFoundException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import {User, UserRole} from '../platform/users/entities/user.entity';
import {RefreshSession} from './entities/refresh-session.entity';
import {RegisterDto} from './dto/register.dto';
import {LoginResponseDto} from './dto/login-response.dto';
import {CurrentUserDto} from './dto/current-user.dto';
import {AuthProviderService} from './services/auth-provider.service';
import {AuthProviderType} from './entities/auth-provider.entity';
import {InvitationService} from './services/invitation.service';
import {GoogleOAuthService} from './services/google-oauth.service';
import {EmailService} from '../../common/services/email.service';
import { CookieService } from './services/cookie.service';
import { AuditService } from './services/audit.service';
import { AuthAuditEvent } from './enums/auth-audit-event.enum';
import { UserProvisioningService } from './services/user-provisioning.service';
import * as crypto from 'crypto';
import { Response } from 'express';
import { SessionDto } from './dto/session.dto';
import { parseUserAgent } from '../../common/utils/user-agent.utils';
import { ForbiddenException } from '@nestjs/common';

// Error messages constants
const AUTH_ERROR_MESSAGES = {
  USER_ACCOUNT_DEACTIVATED: 'User account is deactivated',
  EMAIL_NOT_VERIFIED: 'Your Google account is not verified. Please verify your email with Google.',
  NO_ACCOUNT_FOUND: 'No account found. Please use an invitation to create an account or login with your local account to link Google.',
  EMAIL_MISMATCH: 'The Google email does not match the invitation email',
  USER_NOT_FOUND: 'User not found',
  EMAIL_MISMATCH_OWN: 'The Google email does not match your account email',
} as const;

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(RefreshSession)
        private refreshSessionRepository: Repository<RefreshSession>,
        private jwtService: JwtService,
        private configService: ConfigService,
        private authProviderService: AuthProviderService,
        private invitationService: InvitationService,
        private googleOAuthService: GoogleOAuthService,
        private emailService: EmailService,
        private cookieService: CookieService,
        private auditService: AuditService,
        private userProvisioningService: UserProvisioningService,
    ) { }

    // ──────────────────────────────────────────────
    //  Private Helper Methods
    // ──────────────────────────────────────────────

    private isUserActive(user: User): boolean {
        return user.isActive === true;
    }

    private validateUserActive(user: User): void {
        if (!this.isUserActive(user)) {
            throw new UnauthorizedException(AUTH_ERROR_MESSAGES.USER_ACCOUNT_DEACTIVATED);
        }
    }

    async validateUser(email: string, pass: string, metadata?: { ipAddress: string | null; userAgent: string | null }): Promise<Omit<User, 'hashedPassword'> | null> {
        const user = await this.usersRepository.findOne({
            where: { email },
            relations: ['owner']
        });

        if (!user) {
            // Log failed login attempt
            await this.auditService.logEvent({
                email,
                eventType: AuthAuditEvent.LOGIN_FAILED,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: false,
                failureReason: 'User not found',
            });

            // Check for suspicious activity
            await this.auditService.detectSuspiciousActivity(email, metadata?.ipAddress || null, 10, 10);

            return null;
        }

        // Check if user is active
        try {
            this.validateUserActive(user);
        } catch (error) {
            // Log failed login due to inactive account
            await this.auditService.logEvent({
                email,
                userId: user.id,
                eventType: AuthAuditEvent.LOGIN_FAILED,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: false,
                failureReason: 'Account deactivated',
            });

            // Check for suspicious activity
            await this.auditService.detectSuspiciousActivity(email, metadata?.ipAddress || null, 10, 10);

            throw error;
        }

        // Vérifier via AuthProviderService
        const authProvider = await this.authProviderService.findByUser(user.id);
        const localProvider = authProvider?.find(ap => ap.provider === AuthProviderType.LOCAL);

        if (localProvider && await bcrypt.compare(pass, localProvider.passwordHash)) {
            // Log successful login
            await this.auditService.logEvent({
                email,
                userId: user.id,
                eventType: AuthAuditEvent.LOGIN_SUCCESS,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: true,
            });
            
            const { hashedPassword, ...result } = user;
            return result;
        }

        // Log failed login due to wrong password
        await this.auditService.logEvent({
            email,
            userId: user.id,
            eventType: AuthAuditEvent.LOGIN_FAILED,
            ipAddress: metadata?.ipAddress || null,
            userAgent: metadata?.userAgent || null,
            success: false,
            failureReason: 'Invalid password',
        });

        // Check for suspicious activity
        await this.auditService.detectSuspiciousActivity(email, metadata?.ipAddress || null, 10, 10);

        return null;
    }

    private hashString(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    private async generateTokens(
        user: User, 
        existingSessionId?: string,
        metadata?: { ipAddress: string | null; userAgent: string | null }
    ) {
        const payload = { sub: user.email, id: user.id, role: user.role, ownerId: user.ownerId };
        const accessToken = this.jwtService.sign(payload);
        
        const sessionId = existingSessionId || crypto.randomUUID();
        const refreshPayload = { ...payload, sessionId, jti: crypto.randomUUID() };
        
        const refreshSecret = this.configService.get<string>('security.refreshSecretKey') || this.configService.get<string>('security.secretKey');
        const expiresInDays = this.configService.get<number>('security.refreshTokenExpireDays');
        
        const refreshToken = this.jwtService.sign(refreshPayload, {
            secret: refreshSecret,
            expiresIn: `${expiresInDays}d`,
        });

        const hashedRefreshToken = this.hashString(refreshToken);
        
        if (existingSessionId) {
            await this.refreshSessionRepository.update(existingSessionId, {
                refreshTokenHash: hashedRefreshToken,
                lastUsedAt: new Date(),
            });
        } else {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);

            let parsedUa = { browser: null, os: null, deviceName: null } as any;
            if (metadata?.userAgent) {
                parsedUa = parseUserAgent(metadata.userAgent);
            }

            const session = this.refreshSessionRepository.create({
                id: sessionId,
                userId: user.id,
                refreshTokenHash: hashedRefreshToken,
                expiresAt,
                lastUsedAt: new Date(),
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                browser: parsedUa.browser,
                os: parsedUa.os,
                deviceName: parsedUa.deviceName,
            });
            await this.refreshSessionRepository.save(session);
        }

        return { accessToken, refreshToken };
    }

    async login(
        user: Omit<User, 'hashedPassword'>,
        metadata?: { ipAddress: string | null; userAgent: string | null }
    ): Promise<LoginResponseDto & { refresh_token: string }> {
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            ownerId: user.ownerId,
            owner: user.owner,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        
        const authProviders = await this.authProviderService.findByUser(user.id);
        const localProvider = authProviders?.find(ap => ap.provider === AuthProviderType.LOCAL);
        if (localProvider) {
            await this.authProviderService.updateLastLogin(localProvider);
        }
        
        const { accessToken, refreshToken } = await this.generateTokens(user as User, undefined, metadata);
        
        return {
            access_token: accessToken,
            token_type: 'Bearer',
            user: userResponse,
            refresh_token: refreshToken,
        };
    }

    async refreshTokens(refreshToken: string, metadata?: { ipAddress: string | null; userAgent: string | null }) {
        const refreshSecret = this.configService.get<string>('security.refreshSecretKey') || this.configService.get<string>('security.secretKey');
        
        let decoded: any;
        try {
            decoded = this.jwtService.verify(refreshToken, { secret: refreshSecret });
        } catch (error) {
            await this.auditService.logEvent({
                email: 'unknown',
                eventType: AuthAuditEvent.REFRESH_FAILED,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: false,
                failureReason: 'Invalid or expired refresh token',
            });
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const sessionId = decoded.sessionId;
        if (!sessionId) {
            await this.auditService.logEvent({
                email: 'unknown',
                eventType: AuthAuditEvent.REFRESH_FAILED,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: false,
                failureReason: 'Invalid token format',
            });
            throw new UnauthorizedException('Invalid token format');
        }

        const session = await this.refreshSessionRepository.findOne({ where: { id: sessionId }, relations: ['user'] });
        if (!session) {
            await this.auditService.logEvent({
                email: 'unknown',
                eventType: AuthAuditEvent.REFRESH_FAILED,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: false,
                failureReason: 'Session not found',
            });
            throw new UnauthorizedException('Session not found');
        }

        this.validateUserActive(session.user);

        if (session.revokedAt) {
            await this.auditService.logEvent({
                email: session.user.email,
                userId: session.user.id,
                eventType: AuthAuditEvent.REFRESH_FAILED,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: false,
                failureReason: 'Session revoked',
            });
            throw new UnauthorizedException('Session revoked');
        }

        const hashedInputToken = this.hashString(refreshToken);
        if (session.refreshTokenHash !== hashedInputToken) {
            // Replay attack detected
            session.revokedAt = new Date();
            await this.refreshSessionRepository.save(session);
            
            await this.auditService.logEvent({
                email: session.user.email,
                userId: session.user.id,
                eventType: AuthAuditEvent.REPLAY_ATTACK,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: false,
                failureReason: 'Replay attack detected',
                sessionId: session.id,
            });
            
            throw new UnauthorizedException('Invalid refresh token (Replay Attack detected)');
        }

        if (session.expiresAt < new Date()) {
            await this.auditService.logEvent({
                email: session.user.email,
                userId: session.user.id,
                eventType: AuthAuditEvent.REFRESH_FAILED,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: false,
                failureReason: 'Session expired',
            });
            throw new UnauthorizedException('Session expired');
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await this.generateTokens(session.user, session.id);

        await this.auditService.logEvent({
            email: session.user.email,
            userId: session.user.id,
            eventType: AuthAuditEvent.REFRESH_SUCCESS,
            ipAddress: metadata?.ipAddress || null,
            userAgent: metadata?.userAgent || null,
            success: true,
            sessionId: session.id,
        });

        return { access_token: newAccessToken, refresh_token: newRefreshToken };
    }

    async getCurrentUser(userId: string): Promise<CurrentUserDto> {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['owner']
        });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Vérifier si l'utilisateur est toujours actif (lèvera une exception sinon)
        this.validateUserActive(user);

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            ownerId: user.ownerId,
            owner: user.owner,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }

    async register(registerDto: RegisterDto) {
        // Use UserProvisioningService to create user with AuthProvider LOCAL
        const { user } = await this.userProvisioningService.createUser(
            registerDto.name,
            registerDto.email,
            registerDto.password,
            {
                role: UserRole.OWNER_USER,
                isActive: true,
            },
        );

        const { hashedPassword: _, ...result } = user;
        return result;
    }

    /**
     * Resolve the current user for JWT validation.
     * `sub` is the user id for new tokens; legacy tokens may still use email as `sub`.
     */
    async resolveUserFromJwtSubject(sub: string) {
        const where = sub.includes('@') ? { email: sub } : { id: sub };
        const user = await this.usersRepository.findOne({
            where,
            relations: ['owner'],
        });

        if (!user) {
            return null;
        }

        // Check if user is active
        if (!this.isUserActive(user)) {
            return null;
        }

        const { hashedPassword, ...result } = user;
        return result;
    }



    async loginWithGoogle(
        code: string, 
        invitationToken?: string,
        metadata?: { ipAddress: string | null; userAgent: string | null }
    ) {
        try {
            // Échanger le code contre les tokens Google
            const tokens = await this.googleOAuthService.exchangeCodeForTokens(code);
            
            // Vérifier le token ID
            const googleProfile = await this.googleOAuthService.verifyIdToken(tokens.id_token);
            
            if (!googleProfile.emailVerified) {
                await this.auditService.logEvent({
                    email: googleProfile.email,
                    eventType: AuthAuditEvent.GOOGLE_LOGIN_FAILED,
                    ipAddress: metadata?.ipAddress || null,
                    userAgent: metadata?.userAgent || null,
                    success: false,
                    failureReason: 'Email not verified',
                });
                throw new BadRequestException(AUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
            }

            // Chercher un AuthProvider Google existant
            const existingAuthProvider = await this.authProviderService.findByProviderAndUserId(
                AuthProviderType.GOOGLE,
                googleProfile.sub,
            );

            if (existingAuthProvider) {
                // Compte déjà lié - connexion directe
                // Check if user is active
                this.validateUserActive(existingAuthProvider.user);
                await this.authProviderService.updateLastLogin(existingAuthProvider);
                
                // Log successful Google login
                await this.auditService.logEvent({
                    email: googleProfile.email,
                    userId: existingAuthProvider.user.id,
                    eventType: AuthAuditEvent.GOOGLE_LOGIN_SUCCESS,
                    ipAddress: metadata?.ipAddress || null,
                    userAgent: metadata?.userAgent || null,
                    success: true,
                });
                
                return this.login(existingAuthProvider.user, metadata);
            }

            // Si un utilisateur existe déjà avec cet email
            const existingUserByEmail = await this.usersRepository.findOne({ where: { email: googleProfile.email } });
            if (existingUserByEmail) {
                // Si une invitation est fournie, mettre à jour le rôle et l'activation selon l'invitation
                if (invitationToken) {
                    const invitation = await this.invitationService.validateInvitation(invitationToken);
                    
                    // Vérifier que l'email Google correspond à l'email de l'invitation
                    if (googleProfile.email !== invitation.email) {
                        await this.auditService.logEvent({
                            email: googleProfile.email,
                            userId: existingUserByEmail.id,
                            eventType: AuthAuditEvent.GOOGLE_LOGIN_FAILED,
                            ipAddress: metadata?.ipAddress || null,
                            userAgent: metadata?.userAgent || null,
                            success: false,
                            failureReason: 'Email mismatch with invitation',
                        });
                        throw new BadRequestException(AUTH_ERROR_MESSAGES.EMAIL_MISMATCH);
                    }
                    
                    // Mettre à jour le rôle et l'activation selon l'invitation
                    existingUserByEmail.role = invitation.role;
                    existingUserByEmail.ownerId = invitation.ownerId || existingUserByEmail.ownerId;
                    existingUserByEmail.isActive = true;
                    await this.usersRepository.save(existingUserByEmail);
                    
                    // Marquer invitation comme utilisée
                    await this.invitationService.markAsUsed(invitationToken);
                } else {
                    // Sans invitation, vérifier que l'utilisateur est actif
                    this.validateUserActive(existingUserByEmail);
                }
                
                // Lier le provider Google à l'utilisateur existant (vérifie les conflits)
                const linkedProvider = await this.authProviderService.linkOAuthProvider(
                    existingUserByEmail,
                    AuthProviderType.GOOGLE,
                    googleProfile.sub,
                );

                await this.authProviderService.updateLastLogin(linkedProvider);
                
                // Log successful Google login (linked account)
                await this.auditService.logEvent({
                    email: googleProfile.email,
                    userId: existingUserByEmail.id,
                    eventType: AuthAuditEvent.GOOGLE_LOGIN_SUCCESS,
                    ipAddress: metadata?.ipAddress || null,
                    userAgent: metadata?.userAgent || null,
                    success: true,
                });
                
                return this.login(existingUserByEmail, metadata);
            }

            // Si pas d'invitation, refuser la création automatique
            if (!invitationToken) {
                await this.auditService.logEvent({
                    email: googleProfile.email,
                    eventType: AuthAuditEvent.GOOGLE_LOGIN_FAILED,
                    ipAddress: metadata?.ipAddress || null,
                    userAgent: metadata?.userAgent || null,
                    success: false,
                    failureReason: 'No invitation for new account',
                });
                throw new UnauthorizedException(AUTH_ERROR_MESSAGES.NO_ACCOUNT_FOUND);
            }

            // Valider l'invitation
            const invitation = await this.invitationService.validateInvitation(invitationToken);

            // Vérifier que l'email Google correspond à l'email de l'invitation
            if (googleProfile.email !== invitation.email) {
                await this.auditService.logEvent({
                    email: googleProfile.email,
                    eventType: AuthAuditEvent.GOOGLE_LOGIN_FAILED,
                    ipAddress: metadata?.ipAddress || null,
                    userAgent: metadata?.userAgent || null,
                    success: false,
                    failureReason: 'Email mismatch with invitation',
                });
                throw new BadRequestException(AUTH_ERROR_MESSAGES.EMAIL_MISMATCH);
            }

            // Créer l'utilisateur et le provider Google dans une transaction
            const newUser = this.usersRepository.create({
                name: googleProfile.email.split('@')[0], // Nom basé sur l'email
                email: googleProfile.email,
                role: invitation.role,
                ownerId: invitation.ownerId,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            await this.usersRepository.save(newUser);

            // Créer le AuthProvider Google
            const authProvider = await this.authProviderService.createOAuthProvider(
                newUser,
                AuthProviderType.GOOGLE,
                googleProfile.sub,
            );

            // Marquer l'invitation comme utilisée
            await this.invitationService.markAsUsed(invitationToken);

            // Envoyer email de bienvenue de manière asynchrone (fire & forget)
            setImmediate(async () => {
                try {
                    await this.emailService.sendWelcomeEmail(newUser.email);
                } catch (err: any) {
                    console.error('Failed to send welcome email:', err?.message ?? err);
                }
            });

            // Mettre à jour lastLoginAt
            await this.authProviderService.updateLastLogin(authProvider);
            
            // Log successful Google login (new account)
            await this.auditService.logEvent({
                email: googleProfile.email,
                userId: newUser.id,
                eventType: AuthAuditEvent.GOOGLE_LOGIN_SUCCESS,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: true,
            });

            return this.login(newUser, metadata);
        } catch (error) {
            // Log any unexpected failures
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }
            
            await this.auditService.logEvent({
                email: 'unknown',
                eventType: AuthAuditEvent.GOOGLE_LOGIN_FAILED,
                ipAddress: metadata?.ipAddress || null,
                userAgent: metadata?.userAgent || null,
                success: false,
                failureReason: 'Unexpected error',
            });
            throw error;
        }
    }

    async linkGoogleAccount(userId: string, code: string) {
        // Échanger le code contre les tokens Google
        const tokens = await this.googleOAuthService.exchangeCodeForTokens(code);
        
        // Vérifier le token ID
        const googleProfile = await this.googleOAuthService.verifyIdToken(tokens.id_token);
        
        if (!googleProfile.emailVerified) {
            throw new BadRequestException(AUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED);
        }

        // Récupérer l'utilisateur
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException(AUTH_ERROR_MESSAGES.USER_NOT_FOUND);
        }

        // Vérifier que l'email Google correspond à l'email de l'utilisateur
        if (googleProfile.email !== user.email) {
            throw new BadRequestException(AUTH_ERROR_MESSAGES.EMAIL_MISMATCH_OWN);
        }

        // Lier le compte Google
        const authProvider = await this.authProviderService.linkOAuthProvider(
            user,
            AuthProviderType.GOOGLE,
            googleProfile.sub,
        );

        await this.authProviderService.updateLastLogin(authProvider);

        return authProvider;
    }

    async unlinkProvider(userId: string, provider: AuthProviderType) {
        await this.authProviderService.unlinkProvider(userId, provider);
    }

    async getUserProviders(userId: string) {
        const authProviders = await this.authProviderService.getUserProviders(userId);
        
        return authProviders.map(ap => ({
            provider: ap.provider,
            linked: true,
            providerUserId: ap.providerUserId,
            lastLoginAt: ap.lastLoginAt,
        }));
    }

    async refreshToken() {
        // Pour l'instant, retourne un token vide car le refresh token n'est pas encore implémenté
        // Cette méthode sera améliorée une fois que le système de refresh token sera complet
        // Pour l'instant, on retourne une erreur car le refresh n'est pas supporté
        throw new UnauthorizedException('Refresh token not yet implemented');
    }

    async logout(refreshToken?: string, metadata?: { ipAddress: string | null; userAgent: string | null }): Promise<void> {
        if (!refreshToken) {
            return;
        }

        const refreshSecret = this.configService.get<string>('security.refreshSecretKey') || this.configService.get<string>('security.secretKey');

        let decoded: any;
        try {
            decoded = this.jwtService.verify(refreshToken, { secret: refreshSecret, ignoreExpiration: true });
        } catch (error) {
            // Token invalide, ignorer (idempotence)
            return;
        }

        const sessionId = decoded.sessionId;
        if (!sessionId) {
            return;
        }

        const session = await this.refreshSessionRepository.findOne({ where: { id: sessionId }, relations: ['user'] });
        if (!session || session.revokedAt) {
            return;
        }

        const hashedInputToken = this.hashString(refreshToken);
        if (session.refreshTokenHash !== hashedInputToken) {
            // Le token ne correspond pas au hash actuel (ex: token obsolète), on ne révoque pas
            return;
        }

        session.revokedAt = new Date();
        await this.refreshSessionRepository.save(session);

        // Log logout event
        await this.auditService.logEvent({
            email: session.user.email,
            userId: session.user.id,
            eventType: AuthAuditEvent.LOGOUT,
            ipAddress: metadata?.ipAddress || null,
            userAgent: metadata?.userAgent || null,
            success: true,
            sessionId: session.id,
        });
    }

    getSessionIdFromToken(refreshToken: string | undefined): string | null {
        if (!refreshToken) return null;
        try {
            const refreshSecret = this.configService.get<string>('security.refreshSecretKey') || this.configService.get<string>('security.secretKey');
            const decoded = this.jwtService.verify(refreshToken, { secret: refreshSecret, ignoreExpiration: true });
            return decoded.sessionId || null;
        } catch {
            return null;
        }
    }

    async getSessions(userId: string, currentSessionId: string | null): Promise<SessionDto[]> {
        const sessions = await this.refreshSessionRepository.find({
            where: { userId },
            order: { lastUsedAt: 'DESC' },
        });

        const now = new Date();

        // Filtrer les sessions actives
        const activeSessions = sessions.filter(session => !session.revokedAt && session.expiresAt > now);

        return activeSessions.map(session => ({
            id: session.id,
            createdAt: session.createdAt,
            lastUsedAt: session.lastUsedAt,
            expiresAt: session.expiresAt,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            deviceName: session.deviceName,
            browser: session.browser,
            os: session.os,
            isCurrentSession: session.id === currentSessionId,
        } as unknown as SessionDto));
    }

    async deleteSession(userId: string, sessionId: string): Promise<void> {
        const session = await this.refreshSessionRepository.findOne({ where: { id: sessionId }, relations: ['user'] });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.userId !== userId) {
            throw new ForbiddenException('You can only delete your own sessions');
        }

        session.revokedAt = new Date();
        await this.refreshSessionRepository.save(session);

        // Log session revocation
        await this.auditService.logEvent({
            email: session.user.email,
            userId: session.user.id,
            eventType: AuthAuditEvent.SESSION_REVOKED,
            success: true,
            sessionId: session.id,
        });
    }

    async deleteAllOtherSessions(userId: string, currentSessionId: string): Promise<void> {
        const sessions = await this.refreshSessionRepository.find({
            where: { userId },
            relations: ['user'],
        });

        const now = new Date();
        const activeOtherSessions = sessions.filter(
            session => session.id !== currentSessionId && !session.revokedAt && session.expiresAt > now
        );

        for (const session of activeOtherSessions) {
            session.revokedAt = now;
        }

        if (activeOtherSessions.length > 0) {
            await this.refreshSessionRepository.save(activeOtherSessions);

            // Log all sessions revocation
            const userEmail = activeOtherSessions[0].user.email;
            await this.auditService.logEvent({
                email: userEmail,
                userId,
                eventType: AuthAuditEvent.ALL_SESSIONS_REVOKED,
                success: true,
                failureReason: `${activeOtherSessions.length} sessions revoked`,
            });
        }
    }
}
