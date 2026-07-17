import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Purchase } from './purchase.entity';

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

    @Column({ name: 'owner_id', nullable: true })
    ownerId: string;

    @OneToMany(() => Purchase, (purchase) => purchase.supplier)
    purchases: Purchase[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
