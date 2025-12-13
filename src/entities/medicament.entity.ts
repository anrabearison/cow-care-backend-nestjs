import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('medicaments')
export class Medicament {
    @PrimaryColumn({ length: 50 })
    id: string;

    @Column({ name: 'nom', length: 255 })
    name: string;

    @Column({ length: 100 })
    type: string;

    @Column({ name: 'dosage_quantite', type: 'numeric', precision: 10, scale: 2, nullable: true })
    dosageQuantite: number;

    // Assuming DosageUnit and AdministrationRoute are imported or strings. Using string/enum if available.
    // For now, using string or enum if I can import it. Let's check imports.
    // I will use string for enums to avoid import cycles if not sure, or import them.
    // Actually, I should import them from treatment entity or define them here if shared.
    // Let's use simple columns for now to match schema types.

    @Column({ name: 'dosage_unite', nullable: true })
    dosageUnite: string;

    @Column({ name: 'dosage_poids', type: 'numeric', precision: 10, scale: 2, nullable: true })
    dosagePoids: number;

    @Column({ name: 'dosage_unite_poids', length: 20, nullable: true })
    dosageUnitePoids: string;

    @Column({ name: 'dosage_notes', type: 'text', nullable: true })
    dosageNotes: string;

    @Column({ name: 'default_route', nullable: true })
    defaultRoute: string;

    @Column({ name: 'withdrawal_period_meat', type: 'int', default: 0 })
    withdrawalPeriodMeat: number;

    @Column({ name: 'withdrawal_period_milk', type: 'int', default: 0 })
    withdrawalPeriodMilk: number;

    @Column({ name: 'dosage_recommande_old', length: 255, nullable: true })
    dosageRecommandeOld: string;

    @Column({ length: 255, nullable: true })
    fabricant: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
