import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { HerdBook } from '../../herd-books/entities/herd-book.entity';
import { HerdBookCattlePassport } from './herd-book-cattle-passport.entity';
import { Applicant } from './applicant.entity';
import { Location } from './location.entity';
import { PassportCattleSnapshot } from './passport-cattle-snapshot.entity';
import { PassportAudit } from './passport-audit.entity';

export enum PassportStatus {
    DRAFT = 'DRAFT',
    GENERATED = 'GENERATED',
    USED = 'USED',
    CANCELLED = 'CANCELLED',
}

@Entity('passport')
export class Passport {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'passport_number', length: 50, unique: true })
    @Index('IDX_passport_number')
    passportNumber: string;

    // Emission information
    @Column({ name: 'location', length: 100 })
    location: string;

    @Column({ name: 'issue_date', type: 'date' })
    issueDate: Date;

    @Column({ name: 'district', length: 100 })
    district: string;

    // Applicant information
    @Column({ name: 'applicant_id', type: 'uuid', nullable: true })
    @Index('IDX_passport_applicant')
    applicantId: string;

    @ManyToOne(() => Applicant, { nullable: true })
    @JoinColumn({ name: 'applicant_id' })
    applicant: Applicant;

    // Legacy fields for backward compatibility
    @Column({ name: 'applicant_name', length: 200, nullable: true })
    applicantName: string;

    @Column({ name: 'cin_number', length: 50, nullable: true })
    cinNumber: string;

    @Column({ name: 'cin_issue_date', type: 'date', nullable: true })
    cinIssueDate: Date;

    @Column({ name: 'cin_issue_location', length: 100, nullable: true })
    cinIssueLocation: string;

    // Residence information with Location references
    @Column({ name: 'residence_commune_id', type: 'uuid', nullable: true })
    @Index('IDX_passport_residence_commune')
    residenceCommuneId: string;

    @ManyToOne(() => Location, { nullable: true })
    @JoinColumn({ name: 'residence_commune_id' })
    residenceCommune: Location;

    @Column({ name: 'village_id', type: 'uuid', nullable: true })
    @Index('IDX_passport_village')
    villageId: string;

    @ManyToOne(() => Location, { nullable: true })
    @JoinColumn({ name: 'village_id' })
    village: Location;

    @Column({ name: 'commune_id', type: 'uuid', nullable: true })
    @Index('IDX_passport_commune')
    communeId: string;

    @ManyToOne(() => Location, { nullable: true })
    @JoinColumn({ name: 'commune_id' })
    commune: Location;

    @Column({ name: 'residence_district_id', type: 'uuid', nullable: true })
    @Index('IDX_passport_residence_district')
    residenceDistrictId: string;

    @ManyToOne(() => Location, { nullable: true })
    @JoinColumn({ name: 'residence_district_id' })
    residenceDistrict: Location;

    @Column({ name: 'region_id', type: 'uuid', nullable: true })
    @Index('IDX_passport_region')
    regionId: string;

    @ManyToOne(() => Location, { nullable: true })
    @JoinColumn({ name: 'region_id' })
    region: Location;

    // Legacy fields for backward compatibility
    @Column({ name: 'residence_commune', length: 100, nullable: true })
    residenceCommuneLegacy: string;

    @Column({ name: 'village_legacy', length: 100, nullable: true })
    villageLegacy: string;

    @Column({ name: 'commune_legacy', length: 100, nullable: true })
    communeLegacy: string;

    @Column({ name: 'residence_district_legacy', length: 100, nullable: true })
    residenceDistrictLegacy: string;

    @Column({ name: 'region_legacy', length: 100, nullable: true })
    regionLegacy: string;

    // Transfer information
    @Column({ name: 'purchase_commune', length: 100 })
    purchaseCommune: string;

    @Column({ name: 'total_cattle', type: 'int' })
    totalCattle: number;

    // Verification information
    @Column({ name: 'verification_date', type: 'date' })
    verificationDate: Date;

    @Column({ name: 'arrete_date', type: 'date' })
    arreteDate: Date;

    // Status and metadata
    @Column({
        type: 'enum',
        enum: PassportStatus,
        enumName: 'passport_status',
        default: PassportStatus.DRAFT,
    })
    status: PassportStatus;

    @Column({ name: 'generated_at', type: 'timestamp', nullable: true })
    generatedAt: Date;

    @Column({ name: 'generated_by', type: 'uuid', nullable: true })
    generatedBy: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'generated_by' })
    generator: User;

    @Column({ name: 'qr_code', length: 500, nullable: true })
    qrCode: string;

    @Column({ name: 'pdf_url', length: 500, nullable: true })
    pdfUrl: string;

    // Relations
    @Column({ name: 'herd_book_id', type: 'uuid' })
    herdBookId: string;

    @ManyToOne(() => HerdBook)
    @JoinColumn({ name: 'herd_book_id' })
    herdBook: HerdBook;

    @OneToMany(() => HerdBookCattlePassport, (herdBookCattlePassport) => herdBookCattlePassport.passport, { cascade: true })
    cattle: HerdBookCattlePassport[];

    @OneToMany(() => PassportCattleSnapshot, (snapshot) => snapshot.passport, { cascade: true })
    snapshots: PassportCattleSnapshot[];

    @OneToMany(() => PassportAudit, (audit) => audit.passport, { cascade: true })
    audits: PassportAudit[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
