import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../platform/users/entities/user.entity';

@Entity('refresh_sessions')
export class RefreshSession {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @ManyToOne(() => User, (user) => user.refreshSessions, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ name: 'refresh_token_hash', length: 255 })
    refreshTokenHash: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
    lastUsedAt: Date;

    @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
    revokedAt: Date;

    @Column({ name: 'ip_address', type: 'varchar', nullable: true })
    ipAddress: string | null;

    @Column({ name: 'user_agent', type: 'varchar', nullable: true })
    userAgent: string | null;

    @Column({ name: 'device_name', type: 'varchar', nullable: true })
    deviceName: string | null;

    @Column({ name: 'browser', type: 'varchar', nullable: true })
    browser: string | null;

    @Column({ name: 'os', type: 'varchar', nullable: true })
    os: string | null;
}
