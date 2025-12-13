import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('event_types')
export class EventType {
    @PrimaryColumn({ length: 50 })
    id: string;

    @Column({ name: 'nom', length: 255 })
    nom: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ length: 10, nullable: true })
    icone: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
