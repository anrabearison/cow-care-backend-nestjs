import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
import { AuthAuditEvent } from '../enums/auth-audit-event.enum';

/**
 * Authentication Audit Log Entity
 * 
 * This entity stores security-related events for audit purposes.
 * No tokens or cookies are stored - only metadata for security analysis.
 */
@Entity('auth_audit_logs')
export class AuthAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  @Index()
  userId: string | null;

  @Column({ name: 'email' })
  @Index()
  email: string;

  @Column({
    type: 'enum',
    enum: AuthAuditEvent,
    name: 'event_type',
  })
  @Index()
  eventType: AuthAuditEvent;

  @Column({ name: 'ip_address', nullable: true })
  @Index()
  ipAddress: string | null;

  @Column({ name: 'user_agent', nullable: true, type: 'text' })
  userAgent: string | null;

  @Column({ name: 'success' })
  success: boolean;

  @Column({ name: 'failure_reason', nullable: true, type: 'text' })
  failureReason: string | null;

  @Column({ name: 'session_id', nullable: true })
  @Index()
  sessionId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
}
