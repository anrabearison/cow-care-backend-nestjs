import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { UserRole } from '../../platform/users/entities/user.entity';

@Entity('invitations')
export class Invitation {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    email: string;

    @Column({ type: 'enum', enum: UserRole })
    role: UserRole;

    @Column({ name: 'owner_id', type: 'uuid', nullable: true })
    ownerId: string;

    @Column({ length: 255, unique: true })
    token: string;

    @Column({ name: 'expires_at', type: 'timestamp' })
    expiresAt: Date;

    @Column({ name: 'used_at', type: 'timestamp', nullable: true })
    usedAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
