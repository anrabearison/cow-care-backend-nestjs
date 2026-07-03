import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Location } from './location.entity';
import { Passport } from './passport.entity';

@Entity('applicant')
export class Applicant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'name', length: 200 })
  @Index('IDX_applicant_name')
  name: string;

  @Column({ name: 'cin_number', length: 50, unique: true })
  @Index('IDX_applicant_cin')
  cinNumber: string;

  @Column({ name: 'cin_issue_date', type: 'date' })
  cinIssueDate: Date;

  @Column({ name: 'cin_issue_location', length: 100 })
  cinIssueLocation: string;

  // Residence location references
  @Column({ name: 'residence_commune_id', type: 'uuid', nullable: true })
  @Index('IDX_applicant_residence_commune')
  residenceCommuneId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'residence_commune_id' })
  residenceCommune: Location;

  @Column({ name: 'fokontany_id', type: 'uuid', nullable: true })
  @Index('IDX_applicant_fokontany')
  fokontanyId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'fokontany_id' })
  fokontany: Location;

  @Column({ name: 'commune_id', type: 'uuid', nullable: true })
  @Index('IDX_applicant_commune')
  communeId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'commune_id' })
  commune: Location;

  @Column({ name: 'district_id', type: 'uuid', nullable: true })
  @Index('IDX_applicant_district')
  districtId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'district_id' })
  district: Location;

  @Column({ name: 'region_id', type: 'uuid', nullable: true })
  @Index('IDX_applicant_region')
  regionId: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'region_id' })
  region: Location;

  // Legacy fields for backward compatibility (will be deprecated)
  @Column({ name: 'residence_commune', length: 100, nullable: true })
  residenceCommuneLegacy: string;

  @Column({ name: 'fokontany_legacy', length: 100, nullable: true })
  fokontanyLegacy: string;

  @Column({ name: 'commune_legacy', length: 100, nullable: true })
  communeLegacy: string;

  @Column({ name: 'district_legacy', length: 100, nullable: true })
  districtLegacy: string;

  @Column({ name: 'region_legacy', length: 100, nullable: true })
  regionLegacy: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToMany(() => Passport, (passport) => passport.applicant)
  passports: Passport[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
