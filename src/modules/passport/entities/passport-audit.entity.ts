import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Passport } from './passport.entity';
import { PassportStatus } from './passport.entity';
import { User } from '../../users/entities/user.entity';

export enum AuditAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  GENERATED = 'GENERATED',
  CANCELLED = 'CANCELLED',
  USED = 'USED',
  STATUS_CHANGED = 'STATUS_CHANGED',
}

@Entity('passport_audit')
export class PassportAudit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'passport_id', type: 'uuid' })
  @Index('IDX_audit_passport')
  passportId: string;

  @ManyToOne(() => Passport, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'passport_id' })
  passport: Passport;

  @Column({
    type: 'enum',
    enum: AuditAction,
    enumName: 'audit_action',
  })
  @Index('IDX_audit_action')
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: PassportStatus,
    nullable: true,
    enumName: 'passport_status',
  })
  previousStatus: PassportStatus;

  @Column({
    type: 'enum',
    enum: PassportStatus,
    nullable: true,
    enumName: 'passport_status',
  })
  newStatus: PassportStatus;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  @Index('IDX_audit_user')
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'ip_address', length: 50, nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ name: 'reason', type: 'text', nullable: true })
  reason: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index('IDX_audit_created_at')
  createdAt: Date;
}
