import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('owners')
export class Owner {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ name: 'contact_info', length: 255, nullable: true })
    contactInfo: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ name: 'has_completed_initial_import', type: 'boolean', default: false })
    hasCompletedInitialImport: boolean;

    @OneToMany(() => User, (user) => user.owner)
    users: User[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
}
