import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Owner } from '../../owners/entities/owner.entity';
import { AuthProvider } from '../../auth/entities/auth-provider.entity';
import { RefreshSession } from '../../auth/entities/refresh-session.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    OWNER_ADMIN = 'OWNER_ADMIN',
    OWNER_USER = 'OWNER_USER',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255, unique: true })
    email: string;

    @Column({ name: 'hashed_password', length: 255, nullable: true })
    hashedPassword: string;

    @Column({ type: 'enum', enum: [UserRole.SUPER_ADMIN, UserRole.OWNER_ADMIN, UserRole.OWNER_USER] })
    role: UserRole;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @Column({ name: 'owner_id', type: 'uuid', nullable: true })
    ownerId: string;

    @ManyToOne(() => Owner, (owner) => owner.users)
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @Column({ name: 'organization_id', type: 'uuid', nullable: true })
    @Index('IDX_user_organization_id')
    organizationId: string;

    @ManyToOne(() => Organization, (organization) => organization.users, { nullable: true })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @OneToMany(() => AuthProvider, (authProvider) => authProvider.user)
    authProviders: AuthProvider[];

    @OneToMany(() => RefreshSession, (refreshSession) => refreshSession.user)
    refreshSessions: RefreshSession[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
