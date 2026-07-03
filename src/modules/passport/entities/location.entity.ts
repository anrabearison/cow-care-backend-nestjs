import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum LocationType {
  REGION = 'REGION',
  DISTRICT = 'DISTRICT',
  COMMUNE = 'COMMUNE',
  FOKONTANY = 'FOKONTANY',
}

@Entity('location')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: LocationType,
    enumName: 'location_type',
  })
  @Index('IDX_location_type')
  type: LocationType;

  @Column({ name: 'code', length: 20, nullable: true })
  @Index('IDX_location_code')
  code: string;

  // Hierarchical relationships
  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  @Index('IDX_location_parent')
  parentId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Location;

  @Column({ name: 'region_id', type: 'uuid', nullable: true })
  @Index('IDX_location_region')
  regionId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'region_id' })
  region: Location;

  @Column({ name: 'district_id', type: 'uuid', nullable: true })
  @Index('IDX_location_district')
  districtId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'district_id' })
  district: Location;

  @Column({ name: 'commune_id', type: 'uuid', nullable: true })
  @Index('IDX_location_commune')
  communeId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'commune_id' })
  commune: Location;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
