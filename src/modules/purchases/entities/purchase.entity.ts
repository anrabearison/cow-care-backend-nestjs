import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Owner } from '../../owners/entities/owner.entity';
import { Supplier } from './supplier.entity';
import { PurchaseItem } from './purchase-item.entity';

@Entity('purchases')
export class Purchase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'purchase_date', type: 'date' })
    purchaseDate: Date;

    @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalAmount: number;

    @Column({ name: 'invoice_number', length: 100, nullable: true })
    invoiceNumber: string;

    @Column({ name: 'health_status', length: 255, nullable: true })
    healthStatus: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @ManyToOne(() => Owner)
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @Column({ name: 'supplier_id', type: 'uuid', nullable: true })
    supplierId: string;

    @ManyToOne(() => Supplier, (supplier) => supplier.purchases)
    @JoinColumn({ name: 'supplier_id' })
    supplier: Supplier;

    @OneToMany(() => PurchaseItem, (item) => item.purchase, { cascade: true })
    items: PurchaseItem[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
}
