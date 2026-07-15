import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Passport } from './passport.entity';
import { User } from '../../../platform/users/entities/user.entity';

const passportStatusValues = ['DRAFT', 'GENERATED', 'USED', 'CANCELLED'] as const;

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
    enum: [AuditAction.CREATED, AuditAction.UPDATED, AuditAction.GENERATED, AuditAction.CANCELLED, AuditAction.USED, AuditAction.STATUS_CHANGED],
    enumName: 'audit_action',
  })
  @Index('IDX_audit_action')
  action: AuditAction;

  @Column({
    type: 'enum',
    enum: passportStatusValues,
    nullable: true,
    enumName: 'passport_status',
    name: 'previous_status',
  })
  previousStatus: string;

  @Column({
    type: 'enum',
    enum: passportStatusValues,
    nullable: true,
    enumName: 'passport_status',
    name: 'new_status',
  })
  newStatus: string;

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
