import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Passport } from './passport.entity';
import { HerdBookCattle } from '../../herd-book-cattle/entities/herd-book-cattle.entity';

@Entity('passport_cattle_snapshot')
export class PassportCattleSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'passport_id', type: 'uuid' })
  @Index('IDX_snapshot_passport')
  passportId: string;

  @ManyToOne(() => Passport, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'passport_id' })
  passport: Passport;

  @Column({ name: 'herd_book_cattle_id', type: 'uuid' })
  @Index('IDX_snapshot_herd_book_cattle')
  herdBookCattleId: string;

  @ManyToOne(() => HerdBookCattle, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'herd_book_cattle_id' })
  herdBookCattle: HerdBookCattle;

  // Snapshot data - frozen at generation time (using same naming as cattle)
  @Column({ name: 'n_carnet', length: 50 })
  nCarnet: string;

  @Column({ name: 'character_name', length: 200 })
  characterName: string;

  @Column({ name: 'name', length: 100 })
  name: string;

  @Column({ name: 'brand', length: 200, nullable: true })
  brand: string;

  @Column({ name: 'quantity', type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'snapshot_date', type: 'timestamp' })
  @Index('IDX_snapshot_date')
  snapshotDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
