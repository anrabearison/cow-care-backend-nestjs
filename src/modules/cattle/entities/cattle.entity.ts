import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Character } from '../../characters/entities/character.entity';
import { Event } from '../../events/entities/event.entity';
import { Treatment } from '../../treatments/entities/treatment.entity';
import { HerdBookCattle } from '../../herd-book-cattle/entities/herd-book-cattle.entity';

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
    @PrimaryColumn({ length: 36 })
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ length: 255, nullable: true })
    nickname: string;

    @Column({
        type: 'enum',
        enum: Gender,
    })
    gender: Gender;

    @Column({ name: 'birth_date', type: 'date' })
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
        enum: SourceType,
    })
    sourceType: SourceType;

    @Column({ name: 'source_supplier', length: 255, nullable: true })
    sourceSupplier: string;

    @Column({ name: 'source_purchase_date', type: 'date', nullable: true })
    sourcePurchaseDate: Date;

    @Column({ name: 'source_purchase_price', type: 'numeric', precision: 12, scale: 2, nullable: true })
    sourcePurchasePrice: number;

    @Column({ name: 'source_purchase_weight', type: 'numeric', precision: 8, scale: 2, nullable: true })
    sourcePurchaseWeight: number;

    @Column({ name: 'source_purchase_health_status', length: 255, nullable: true })
    sourcePurchaseHealthStatus: string;

    @Column({ name: 'source_purchase_notes', type: 'text', nullable: true })
    sourcePurchaseNotes: string;

    @Column({ name: 'source_mother_id', length: 36, nullable: true })
    sourceMotherId: string;

    @ManyToOne(() => Cattle, { nullable: true })
    @JoinColumn({ name: 'source_mother_id' })
    mother: Cattle;

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

    get source() {
        return {
            type: this.sourceType,
            supplier: this.sourceSupplier,
            purchaseDate: this.sourcePurchaseDate,
            purchasePrice: this.sourcePurchasePrice,
            purchaseWeight: this.sourcePurchaseWeight,
            purchaseHealthStatus: this.sourcePurchaseHealthStatus,
            purchaseNotes: this.sourcePurchaseNotes,
            motherId: this.sourceMotherId,
        };
    }
}
