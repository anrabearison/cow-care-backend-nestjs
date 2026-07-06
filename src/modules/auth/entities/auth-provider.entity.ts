import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AuthProviderType {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
    MICROSOFT = 'MICROSOFT',
    APPLE = 'APPLE',
    FACEBOOK = 'FACEBOOK',
}

@Entity('auth_providers')
@Index(['provider', 'providerUserId'], { unique: true })
export class AuthProvider {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.authProviders)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'enum', enum: AuthProviderType })
    provider: AuthProviderType;

    @Column({ name: 'provider_user_id', nullable: true, length: 255 })
    providerUserId: string;

    @Column({ name: 'password_hash', nullable: true, length: 255 })
    passwordHash: string;

    @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
    lastLoginAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
