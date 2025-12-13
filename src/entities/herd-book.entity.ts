import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
