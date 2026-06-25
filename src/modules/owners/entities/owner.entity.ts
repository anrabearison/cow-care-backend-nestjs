import { Entity, PrimaryColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('owners')
export class Owner {
    @PrimaryColumn({ length: 36 })
    id: string;

    @Column({ length: 255 })
    name: string;

    @Column({ name: 'contact_info', length: 255, nullable: true })
    contactInfo: string;

    @Column({ type: 'text', nullable: true })
    address: string;

    @OneToMany(() => User, (user) => user.owner)
    users: User[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
