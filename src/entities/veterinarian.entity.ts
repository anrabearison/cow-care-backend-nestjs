import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('veterinarians')
export class Veterinarian {
    @PrimaryColumn({ length: 50 })
    id: string;

    @Column({ name: 'nom', length: 255 })
    name: string;

    @Column({ length: 255, nullable: true })
    specialite: string;

    @Column({ name: 'telephone', length: 50, nullable: true })
    phone: string;

    @Column({ length: 255, nullable: true })
    email: string;

    @Column({ name: 'adresse', type: 'text', nullable: true })
    address: string;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
