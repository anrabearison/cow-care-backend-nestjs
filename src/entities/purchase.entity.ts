import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Owner } from './owner.entity';
import { Supplier } from './supplier.entity';
import { PurchaseItem } from './purchase-item.entity';

@Entity('purchases')
export class Purchase {
    @PrimaryColumn({ length: 36 })
    id: string;

    @Column({ name: 'purchase_date', type: 'timestamp' })
    purchaseDate: Date;

    @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalAmount: number;

    @Column({ name: 'invoice_number', length: 100, nullable: true })
    invoiceNumber: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ name: 'owner_id', length: 36 })
    ownerId: string;

    @ManyToOne(() => Owner)
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @Column({ name: 'supplier_id', length: 36, nullable: true })
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
}
