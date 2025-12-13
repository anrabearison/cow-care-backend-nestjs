import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cattle } from './cattle.entity';
import { HerdBook } from './herd-book.entity';

@Entity('herd_book_cattle')
export class HerdBookCattle {
    @PrimaryColumn({ length: 36 })
    id: string;

    @Column({ name: 'herd_book_id', length: 36 })
    herdBookId: string;

    @ManyToOne(() => HerdBook)
    @JoinColumn({ name: 'herd_book_id' })
    herdBook: HerdBook;

    @Column({ name: 'cattle_id', length: 36 })
    cattleId: string;

    @ManyToOne(() => Cattle, (cattle) => cattle.herdBookEntries, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cattle_id' })
    cattle: Cattle;

    @Column({ name: 'n_carnet', length: 50, nullable: true })
    nCarnet: string;

    @Column({ name: 'category_id', length: 50 })
    categoryId: string;

    @ManyToOne('Category')
    @JoinColumn({ name: 'category_id' })
    category: any;

    @Column({ name: 'status_id', length: 50 })
    statusId: string;

    @ManyToOne('Status')
    @JoinColumn({ name: 'status_id' })
    status: any;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
