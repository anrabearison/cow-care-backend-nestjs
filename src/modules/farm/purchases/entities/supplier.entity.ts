import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Purchase } from './purchase.entity';
import { Owner } from '../../../platform/owners/entities/owner.entity';

@Entity('suppliers')
export class Supplier {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ name: 'contact_info', length: 255, nullable: true })
    contactInfo: string;

    @Column({ length: 100, nullable: true })
    phone: string;

    @Column({ length: 255, nullable: true })
    email: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @ManyToOne(() => Owner)
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @OneToMany(() => Purchase, (purchase) => purchase.supplier)
    purchases: Purchase[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
