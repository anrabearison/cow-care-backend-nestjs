import { Injectable, UnauthorizedException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RefreshSession } from '../entities/refresh-session.entity';
import { User } from '../../platform/users/entities/user.entity';
import { SessionDto } from '../dto/session.dto';
import { AuditService } from './audit.service';
import { AuthAuditEvent } from '../enums/auth-audit-event.enum';
import { parseUserAgent } from '../../../common/utils/user-agent.utils';

export interface RequestMetadata {
    ipAddress: string | null;
    userAgent: string | null;
}

@Injectable()
export class SessionService {
    constructor(
        @InjectRepository(RefreshSession)
        private readonly refreshSessionRepository: Repository<RefreshSession>,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly auditService: AuditService,
    ) {}

    private hashString(data: string): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    private validateUserActive(user: User): void {
        if (user.isActive !== true) {
            throw new UnauthorizedException('User account is deactivated');
        }
    }

    async generateTokens(
        user: User,
        existingSessionId?: string,
        metadata?: RequestMetadata
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const payload = { sub: user.email, id: user.id, role: user.role, ownerId: user.ownerId };
        const accessToken = this.jwtService.sign(payload);

        const sessionId = existingSessionId || crypto.randomUUID();
        const refreshPayload = { ...payload, sessionId, jti: crypto.randomUUID() };

        const refreshSecret =
            this.configService.get<string>('security.refreshSecretKey') ||
            this.configService.get<string>('security.secretKey');
        const expiresInDays = this.configService.get<number>('security.refreshTokenExpireDays') || 7;

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

    async refreshTokens(refreshToken: string, metadata?: RequestMetadata): Promise<{ access_token: string; refresh_token: string }> {
        const refreshSecret =
            this.configService.get<string>('security.refreshSecretKey') ||
            this.configService.get<string>('security.secretKey');

        let decoded: any;
        try {
            decoded = this.jwtService.verify(refreshToken, { secret: refreshSecret });
        } catch {
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

    async logout(refreshToken?: string, metadata?: RequestMetadata): Promise<void> {
        if (!refreshToken) {
            return;
        }

        const refreshSecret =
            this.configService.get<string>('security.refreshSecretKey') ||
            this.configService.get<string>('security.secretKey');

        let decoded: any;
        try {
            decoded = this.jwtService.verify(refreshToken, { secret: refreshSecret, ignoreExpiration: true });
        } catch {
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
            return;
        }

        session.revokedAt = new Date();
        await this.refreshSessionRepository.save(session);

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
            const refreshSecret =
                this.configService.get<string>('security.refreshSecretKey') ||
                this.configService.get<string>('security.secretKey');
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
