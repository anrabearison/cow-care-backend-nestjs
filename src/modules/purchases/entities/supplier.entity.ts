import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Purchase } from './purchase.entity';
import { Organization } from '../../organizations/entities/organization.entity';

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

    @Column({ name: 'organization_id', type: 'uuid', nullable: true })
    @Index('IDX_supplier_organization_id')
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: true })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @OneToMany(() => Purchase, (purchase) => purchase.supplier)
    purchases: Purchase[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
