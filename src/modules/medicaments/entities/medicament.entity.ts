import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('medicaments')
export class Medicament {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 100 })
    type: string;

    @Column({ name: 'dosage_quantity', type: 'numeric', precision: 10, scale: 2, nullable: true })
    dosageQuantity: number;

    // Assuming DosageUnit and AdministrationRoute are imported or strings. Using string/enum if available.
    // For now, using string or enum if I can import it. Let's check imports.
    // I will use string for enums to avoid import cycles if not sure, or import them.
    // Actually, I should import them from treatment entity or define them here if shared.
    // Let's use simple columns for now to match schema types.

    @Column({ name: 'dosage_unit', nullable: true })
    dosageUnit: string;

    @Column({ name: 'dosage_weight', type: 'numeric', precision: 10, scale: 2, nullable: true })
    dosageWeight: number;

    @Column({ name: 'dosage_weight_unit', length: 20, nullable: true })
    dosageWeightUnit: string;

    @Column({ name: 'dosage_notes', type: 'text', nullable: true })
    dosageNotes: string;

    @Column({ name: 'default_route', nullable: true })
    defaultRoute: string;

    @Column({ name: 'withdrawal_period_meat', type: 'int', default: 0 })
    withdrawalPeriodMeat: number;

    @Column({ name: 'withdrawal_period_milk', type: 'int', default: 0 })
    withdrawalPeriodMilk: number;

    @Column({ length: 255, nullable: true })
    manufacturer: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
