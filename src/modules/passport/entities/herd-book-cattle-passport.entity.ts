import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Passport } from './passport.entity';
import { HerdBookCattle } from '../../herd-book-cattle/entities/herd-book-cattle.entity';
import { PassportCattleSnapshot } from './passport-cattle-snapshot.entity';

@Entity('herd_book_cattle_passport')
export class HerdBookCattlePassport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Relations
    @Column({ name: 'passport_id', type: 'uuid' })
    @Index('IDX_hbcp_passport')
    passportId: string;

    @ManyToOne(() => Passport, (passport) => passport.cattle, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'passport_id' })
    passport: Passport;

    @Column({ name: 'herd_book_cattle_id', type: 'uuid' })
    @Index('IDX_hbcp_herd_book_cattle')
    herdBookCattleId: string;

    @ManyToOne(() => HerdBookCattle, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'herd_book_cattle_id' })
    herdBookCattle: HerdBookCattle;

    @Column({ name: 'snapshot_id', type: 'uuid', nullable: true })
    @Index('IDX_hbcp_snapshot')
    snapshotId: string;

    @ManyToOne(() => PassportCattleSnapshot, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'snapshot_id' })
    snapshot: PassportCattleSnapshot;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
