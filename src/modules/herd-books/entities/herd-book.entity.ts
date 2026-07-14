import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { HerdBookCattle } from '../../herd-book-cattle/entities/herd-book-cattle.entity';
import { Owner } from '../../owners/entities/owner.entity';
import { Organization } from '../../organizations/entities/organization.entity';

@Entity('herd_books')
export class HerdBook {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    reference: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'int' })
    year: number;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @ManyToOne(() => Owner)
    @JoinColumn({ name: 'owner_id' })
    owner: Owner;

    @Column({ name: 'organization_id', type: 'uuid', nullable: true })
    @Index('IDX_herd_book_organization_id')
    organizationId: string;

    @ManyToOne(() => Organization, { nullable: true })
    @JoinColumn({ name: 'organization_id' })
    organization: Organization;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @DeleteDateColumn({ name: 'deleted_at' })
    deletedAt: Date;

    @OneToMany(() => HerdBookCattle, (hbc) => hbc.herdBook)
    entries: HerdBookCattle[];
}
