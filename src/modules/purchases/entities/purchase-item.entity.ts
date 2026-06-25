import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Purchase } from './purchase.entity';
import { Cattle } from '../../cattle/entities/cattle.entity';

@Entity('purchase_items')
export class PurchaseItem {
    @PrimaryColumn({ length: 36 })
    id: string;

    @Column({ name: 'purchase_id', length: 36 })
    purchaseId: string;

    @ManyToOne(() => Purchase, (purchase) => purchase.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'purchase_id' })
    purchase: Purchase;

    @Column({ name: 'cattle_id', length: 36 })
    cattleId: string;

    @ManyToOne(() => Cattle)
    @JoinColumn({ name: 'cattle_id' })
    cattle: Cattle;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    price: number;

    @Column({ name: 'weight_at_purchase', type: 'decimal', precision: 8, scale: 2, nullable: true })
    weightAtPurchase: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
