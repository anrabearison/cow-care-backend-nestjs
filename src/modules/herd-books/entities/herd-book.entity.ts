import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { HerdBookCattle } from '../../herd-book-cattle/entities/herd-book-cattle.entity';
import { Owner } from '../../owners/entities/owner.entity';

@Entity('herd_books')
export class HerdBook {
    @PrimaryColumn({ length: 36 })
    id: string;

    @Column({ length: 100 })
    reference: string;

    @Column({ type: 'int' })
    year: number;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'owner_id', length: 36 })
    ownerId: string;

    @ManyToOne(() => Owner)
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => HerdBookCattle, (hbc) => hbc.herdBook)
    entries: HerdBookCattle[];
}
