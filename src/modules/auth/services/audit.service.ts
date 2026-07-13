import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AuthAuditLog } from '../entities/auth-audit-log.entity';
import { AuthAuditEvent } from '../enums/auth-audit-event.enum';

export interface AuditLogOptions {
  userId?: string | null;
  email: string;
  eventType: AuthAuditEvent;
  ipAddress?: string | null;
  userAgent?: string | null;
  success: boolean;
  failureReason?: string | null;
  sessionId?: string | null;
}

/**
 * Audit Service for security event logging
 * 
 * This service is responsible for recording all authentication-related events
 * for security audit purposes. It is designed to be non-blocking - if the
 * database is unavailable, it logs the error and continues without throwing
 * exceptions that would interrupt the authentication flow.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuthAuditLog)
    private readonly auditLogRepository: Repository<AuthAuditLog>,
  ) {}

  /**
   * Log an authentication event
   * 
   * This method is designed to be non-blocking. If the database operation fails,
   * the error is logged but the authentication flow continues.
   * 
   * @param options - Audit log options
   */
  async logEvent(options: AuditLogOptions): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: options.userId || null,
        email: options.email,
        eventType: options.eventType,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        success: options.success,
        failureReason: options.failureReason || null,
        sessionId: options.sessionId || null,
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error: unknown) {
      // Never throw - log error and continue
      this.logger.error(
        `Failed to log audit event: ${options.eventType} for ${options.email}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Check for suspicious activity patterns
   * 
   * This method checks for patterns like multiple failed login attempts
   * from the same IP address within a short time window.
   * 
   * @param email - User email
   * @param ipAddress - IP address
   * @param minutes - Time window in minutes
   * @param threshold - Number of failures to trigger detection
   * @returns true if suspicious activity is detected
   */
  async detectSuspiciousActivity(
    email: string,
    ipAddress: string | null,
    minutes: number = 10,
    threshold: number = 10,
  ): Promise<boolean> {
    try {
      const since = new Date(Date.now() - minutes * 60 * 1000);

      const count = await this.auditLogRepository.count({
        where: {
          email,
          eventType: AuthAuditEvent.LOGIN_FAILED,
          success: false,
          ipAddress: ipAddress || undefined,
          createdAt: MoreThanOrEqual(since),
        },
      });

      if (count >= threshold) {
        // Log the detection event
        await this.logEvent({
          email,
          eventType: AuthAuditEvent.UNAUTHORIZED_ACCESS,
          ipAddress,
          success: true,
          failureReason: `${count} failed login attempts in ${minutes} minutes`,
        });

        return true;
      }

      return false;
    } catch (error: unknown) {
      this.logger.error(
        'Failed to detect suspicious activity',
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }

  /**
   * Get recent audit logs for a user
   * 
   * @param userId - User ID
   * @param limit - Maximum number of records to return
   * @returns Array of audit logs
   */
  async getUserAuditLogs(userId: string, limit: number = 50): Promise<AuthAuditLog[]> {
    try {
      return this.auditLogRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get audit logs for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }

  /**
   * Get recent audit logs for an IP address
   * 
   * @param ipAddress - IP address
   * @param limit - Maximum number of records to return
   * @returns Array of audit logs
   */
  async getIpAuditLogs(ipAddress: string, limit: number = 50): Promise<AuthAuditLog[]> {
    try {
      return this.auditLogRepository.find({
        where: { ipAddress },
        order: { createdAt: 'DESC' },
        take: limit,
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to get audit logs for IP ${ipAddress}`,
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }
}
