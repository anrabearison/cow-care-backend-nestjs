import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cattle } from './cattle.entity';
import { Medicament } from './medicament.entity';
import { Veterinarian } from './veterinarian.entity';

export enum TreatmentType {
    ANTIBIOTIQUE = 'ANTIBIOTIQUE',
    VACCIN = 'VACCIN',
    VERMIFUGE = 'VERMIFUGE',
    ANTI_INFLAMMATOIRE = 'ANTI_INFLAMMATOIRE',
    VITAMINE = 'VITAMINE',
    AUTRE = 'AUTRE',
}

export enum DosageUnit {
    ML = 'ML',
    L = 'L',
    MG = 'MG',
    G = 'G',
    KG = 'KG',
    COMPRIME = 'COMPRIME',
    BOLUS = 'BOLUS',
    DOSE = 'DOSE',
    UI = 'UI',
}

export enum AdministrationRoute {
    IM = 'IM',
    SC = 'SC',
    IV = 'IV',
    ORAL = 'ORAL',
    TOPICAL = 'TOPICAL',
    INTRAMAMMARY = 'INTRAMAMMARY',
    INHALATION = 'INHALATION',
    OTHER = 'OTHER',
}

@Entity('treatments')
export class Treatment {
    @PrimaryColumn({ length: 36 })
    id: string;

    @Column({ name: 'cattle_id', length: 36 })
    cattleId: string;

    @ManyToOne(() => Cattle, (cattle) => cattle.treatments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cattle_id' })
    cattle: Cattle;

    @Column({ type: 'enum', enum: TreatmentType })
    type: TreatmentType;

    @Column({ type: 'date' })
    date: Date;

    @Column({ name: 'medicament_id', length: 50 })
    medicamentId: string;

    @ManyToOne(() => Medicament)
    @JoinColumn({ name: 'medicament_id' })
    medicament: Medicament;

    // Structured dosage fields
    @Column({ name: 'dosage_quantite', type: 'numeric', precision: 10, scale: 2, nullable: true })
    dosageQuantite: number;

    @Column({ name: 'dosage_unite', type: 'enum', enum: DosageUnit, nullable: true })
    dosageUnite: DosageUnit;

    @Column({ name: 'animal_poids', type: 'numeric', precision: 10, scale: 2, nullable: true })
    animalPoids: number;

    @Column({ name: 'dosage_notes', type: 'text', nullable: true })
    dosageNotes: string;

    // Administration details
    @Column({ name: 'administration_route', type: 'enum', enum: AdministrationRoute, default: AdministrationRoute.IM })
    administrationRoute: AdministrationRoute;

    @Column({ name: 'withdrawal_end_date', type: 'date', nullable: true })
    withdrawalEndDate: Date;

    // Old field kept for backward compatibility
    @Column({ name: 'dosage_old', length: 100, nullable: true })
    dosageOld: string;

    @Column({ name: 'veterinarian_id', length: 50 })
    veterinarianId: string;

    @ManyToOne(() => Veterinarian)
    @JoinColumn({ name: 'veterinarian_id' })
    veterinarian: Veterinarian;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
