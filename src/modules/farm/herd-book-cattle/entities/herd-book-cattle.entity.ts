import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from 'typeorm';
import { Cattle } from '../../cattle/entities/cattle.entity';
import { HerdBook } from '../../herd-books/entities/herd-book.entity';
import { Category } from '../../../platform/categories/entities/category.entity';
import { Status } from '../../../platform/status/entities/status.entity';

@Entity('herd_book_cattle')
@Unique('UQ_hbc_herdbook_cattle', ['herdBookId', 'cattleId'])
export class HerdBookCattle {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'herd_book_id', type: 'uuid' })
    herdBookId: string;

    @ManyToOne(() => HerdBook)
    @JoinColumn({ name: 'herd_book_id' })
    herdBook: HerdBook;

    @Column({ name: 'cattle_id', type: 'uuid' })
    cattleId: string;

    @ManyToOne(() => Cattle, (cattle) => cattle.herdBookEntries, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cattle_id' })
    cattle: Cattle;

    @Column({ name: 'n_carnet', length: 50, nullable: true })
    nCarnet: string;

    @Column({ name: 'category_id', type: 'uuid' })
    categoryId: string;

    @ManyToOne(() => Category)
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Column({ name: 'status_id', type: 'uuid' })
    statusId: string;

    @ManyToOne(() => Status)
    @JoinColumn({ name: 'status_id' })
    status: Status;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
