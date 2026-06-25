import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cattle } from './cattle.entity';
import { EventType } from './event-type.entity';

@Entity('events')
export class Event {
    @PrimaryColumn({ length: 36 })
    id: string;

    @Column({ name: 'cattle_id', length: 36 })
    cattleId: string;

    @ManyToOne(() => Cattle, (cattle) => cattle.events, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cattle_id' })
    cattle: Cattle;

    @Column({ name: 'event_type_id', length: 50 })
    eventTypeId: string;

    @ManyToOne(() => EventType)
    @JoinColumn({ name: 'event_type_id' })
    eventType: EventType;

    @Column({ type: 'date' })
    date: Date;

    @Column({ length: 500 })
    description: string;

    @Column({ type: 'text', nullable: true })
    details: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
