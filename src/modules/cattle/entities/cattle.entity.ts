import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Character } from '../../characters/entities/character.entity';
import { Event } from '../../events/entities/event.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { HerdBookCattle } from '../../herd-book-cattle/entities/herd-book-cattle.entity';
import { Owner } from '../../owners/entities/owner.entity';

export enum Gender {
    M = 'M',
    F = 'F',
}

export enum SourceType {
    ACHETE = 'ACHETE',
    NE_DANS_TROUPEAU = 'NE_DANS_TROUPEAU',
}

@Entity('cattle')
export class Cattle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'owner_id', type: 'uuid' })
    @Index('IDX_cattle_owner_id')
    ownerId: string;

    @ManyToOne(() => Owner)
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255, nullable: true })
    nickname: string;

    @Column({
        type: 'enum',
        enum: [Gender.M, Gender.F],
        enumName: 'cattle_gender_enum',
    })
    @Index('IDX_cattle_gender')
    gender: Gender;

    @Column({ name: 'birth_date', type: 'date' })
    @Index('IDX_cattle_birth_date')
    birthDate: Date;

    @Column({ name: 'character_id', length: 50, nullable: true })
    characterId: string;

    @ManyToOne(() => Character, (character) => character.cattle)
    @JoinColumn({ name: 'character_id' })
    character: Character;

    @Column({ length: 100, nullable: true })
    brand: string;

    @Column({ name: 'distinctive_sign', type: 'text', nullable: true })
    distinctiveSign: string;

    @Column({ length: 500, nullable: true })
    photo: string;

    // Source information
    @Column({
        name: 'source_type',
        type: 'enum',
        enum: [SourceType.ACHETE, SourceType.NE_DANS_TROUPEAU],
        enumName: 'cattle_source_type_enum',
    })
    @Index('IDX_cattle_source_type')
    sourceType: SourceType;

    @Column({ name: 'source_supplier', length: 255, nullable: true })
    sourceSupplier?: string;

    @Column({ name: 'source_purchase_date', type: 'date', nullable: true })
    sourcePurchaseDate?: Date;

    @Column({ name: 'source_purchase_price', type: 'numeric', precision: 10, scale: 2, nullable: true })
    sourcePurchasePrice?: number;

    @Column({ name: 'source_purchase_weight', type: 'numeric', precision: 10, scale: 2, nullable: true })
    sourcePurchaseWeight?: number;

    @Column({ name: 'source_purchase_health_status', length: 255, nullable: true })
    sourcePurchaseHealthStatus?: string;

    @Column({ name: 'source_purchase_notes', type: 'text', nullable: true })
    sourcePurchaseNotes?: string;

    @Column({ name: 'source_mother_id', type: 'uuid', nullable: true })
    sourceMotherId?: string;

    // Genealogy
    @Column({ name: 'mother_id', type: 'uuid', nullable: true })
    motherId: string;

    @ManyToOne(() => Cattle, { nullable: true })
    @JoinColumn({ name: 'mother_id' })
    mother: Cattle;

    @Column({ name: 'father_id', type: 'uuid', nullable: true })
    fatherId: string;

    @ManyToOne(() => Cattle, { nullable: true })
    @JoinColumn({ name: 'father_id' })
    father: Cattle;

    // Relations
    @OneToMany(() => Event, (event: Event) => event.cattle)
    events: Event[];

    @OneToMany(() => Treatment, (treatment) => treatment.cattle)
    treatments: Treatment[];

    @OneToMany(() => HerdBookCattle, (entry) => entry.cattle)
    herdBookEntries: HerdBookCattle[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
}
