import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

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
}
