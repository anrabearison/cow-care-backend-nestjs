import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Cattle } from './cattle.entity';

@Entity('cattle_photos')
@Unique('UQ_cattle_photo_position', ['cattleId', 'position'])
export class CattlePhoto {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'cattle_id', type: 'uuid' })
    cattleId: string;

    @ManyToOne(() => Cattle, (cattle) => cattle.photos, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'cattle_id' })
    cattle: Cattle;

    @Column({ length: 500 })
    url: string;

    @Column({ name: 'public_id', length: 255, nullable: true })
    publicId?: string;

    @Column({ type: 'int', default: 0 })
    position: number;

    @Column({ name: 'is_primary', type: 'boolean', default: false })
    isPrimary: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
