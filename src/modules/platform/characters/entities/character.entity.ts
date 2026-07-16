import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Cattle } from '../../../farm/cattle/entities/cattle.entity';

@Entity('characters')
export class Character {
    @PrimaryColumn({ length: 50 })
    id: string;

    @Column({ length: 100, unique: true })
    name: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Cattle, (cattle) => cattle.character)
    cattle: Cattle[];
}
