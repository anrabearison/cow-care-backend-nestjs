import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Owner } from '../../owners/entities/owner.entity';
import { AuthProvider } from '../../auth/entities/auth-provider.entity';

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

    @OneToMany(() => AuthProvider, (authProvider) => authProvider.user)
    authProviders: AuthProvider[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
