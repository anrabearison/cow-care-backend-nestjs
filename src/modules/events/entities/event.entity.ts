import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { Cattle } from '../../cattle/entities/cattle.entity';
import { EventType } from '../../event-types/entities/event-type.entity';

@Entity('events')
@Index('IDX_events_cattle_date', ['cattleId', 'date'])
export class Event {
    @PrimaryGeneratedColumn('uuid')
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

    @Column({ length: 500, nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    details: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;
}
