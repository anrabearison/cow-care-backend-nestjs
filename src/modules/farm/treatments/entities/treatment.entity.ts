import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Cattle } from '../../cattle/entities/cattle.entity';
import { Medicament } from '../../../platform/medicaments/entities/medicament.entity';
import { Veterinarian } from '../../../veterinarians/entities/veterinarian.entity';

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
@Index('IDX_treatments_cattle_date', ['cattleId', 'date'])
@Index('IDX_treatments_withdrawal', ['withdrawalEndDate'])
export class Treatment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'cattle_id', type: 'uuid' })
    cattleId: string;

    @ManyToOne(() => Cattle, (cattle) => cattle.treatments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cattle_id' })
    cattle: Cattle;

    @Column({ type: 'enum', enum: [TreatmentType.ANTIBIOTIQUE, TreatmentType.VACCIN, TreatmentType.VERMIFUGE, TreatmentType.ANTI_INFLAMMATOIRE, TreatmentType.VITAMINE, TreatmentType.AUTRE] })
    type: TreatmentType;

    @Column({ type: 'date' })
    date: Date;

    @Column({ name: 'medicament_id', type: 'uuid' })
    medicamentId: string;

    @ManyToOne(() => Medicament)
    @JoinColumn({ name: 'medicament_id' })
    medicament: Medicament;

    // Structured dosage fields
    @Column({ name: 'dosage_quantity', type: 'numeric', precision: 10, scale: 2, nullable: true })
    dosageQuantity: number;

    @Column({ name: 'dosage_unit', type: 'enum', enum: [DosageUnit.ML, DosageUnit.L, DosageUnit.MG, DosageUnit.G, DosageUnit.KG, DosageUnit.COMPRIME, DosageUnit.BOLUS, DosageUnit.DOSE, DosageUnit.UI], nullable: true })
    dosageUnit: DosageUnit;

    @Column({ name: 'animal_weight', type: 'numeric', precision: 10, scale: 2, nullable: true })
    animalWeight: number;

    @Column({ name: 'dosage_notes', type: 'text', nullable: true })
    dosageNotes: string;

    // Administration details
    @Column({ name: 'administration_route', type: 'enum', enum: [AdministrationRoute.IM, AdministrationRoute.SC, AdministrationRoute.IV, AdministrationRoute.ORAL, AdministrationRoute.TOPICAL, AdministrationRoute.INTRAMAMMARY, AdministrationRoute.INHALATION, AdministrationRoute.OTHER], default: AdministrationRoute.IM })
    administrationRoute: AdministrationRoute;

    @Column({ name: 'withdrawal_end_date', type: 'date', nullable: true })
    withdrawalEndDate: Date;

    @Column({ name: 'veterinarian_id', type: 'uuid', nullable: true })
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

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
}
