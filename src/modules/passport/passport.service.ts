import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Passport } from './entities/passport.entity';
import { HerdBookCattlePassport } from './entities/herd-book-cattle-passport.entity';
import { PassportCattleSnapshot } from './entities/passport-cattle-snapshot.entity';
import { PassportAudit } from './entities/passport-audit.entity';
import { AuditAction } from './entities/passport-audit.entity';
import { Applicant } from './entities/applicant.entity';
import { PassportStatus } from './entities/passport.entity';
import { CreatePassportDto } from './dto/create-passport.dto';
import { UpdatePassportDto } from './dto/update-passport.dto';
import { PassportRepository } from './passport.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { PdfMakeService } from './pdf-make.service';

@Injectable()
export class PassportService {
    constructor(
        private readonly passportRepository: PassportRepository,
        @InjectRepository(Passport)
        private readonly passportRawRepository: Repository<Passport>,
        @InjectRepository(HerdBookCattlePassport)
        private readonly herdBookCattlePassportRepository: Repository<HerdBookCattlePassport>,
        @InjectRepository(HerdBookCattle)
        private readonly herdBookCattleRepository: Repository<HerdBookCattle>,
        @InjectRepository(PassportCattleSnapshot)
        private readonly passportCattleSnapshotRepository: Repository<PassportCattleSnapshot>,
        @InjectRepository(PassportAudit)
        private readonly passportAuditRepository: Repository<PassportAudit>,
        @InjectRepository(Applicant)
        private readonly applicantRepository: Repository<Applicant>,
        private readonly pdfMakeService: PdfMakeService,
    ) {}

    async create(createPassportDto: CreatePassportDto, herdBookCattleIds: string[], userId?: string): Promise<Passport> {
        // Check if passport number already exists
        const existingPassport = await this.passportRepository.findByPassportNumber(createPassportDto.passportNumber);
        if (existingPassport) {
            throw new BadRequestException('Passport number already exists');
        }

        // Verify all herd book cattle exist and belong to the same herd book
        const herdBookCattle = await this.herdBookCattleRepository.find({
            where: { id: In(herdBookCattleIds) },
        });
        if (herdBookCattle.length !== herdBookCattleIds.length) {
            throw new BadRequestException('Some cattle not found');
        }

        // Verify all cattle belong to the same herd book
        const herdBookIds = [...new Set(herdBookCattle.map(hbc => hbc.herdBookId))];
        if (herdBookIds.length > 1) {
            throw new BadRequestException('All cattle must belong to the same herd book');
        }

        if (herdBookIds[0] !== createPassportDto.herdBookId) {
            throw new BadRequestException('Cattle do not belong to the specified herd book');
        }

        // Verify total cattle count matches
        if (herdBookCattle.length !== createPassportDto.totalCattle) {
            throw new BadRequestException('Total cattle count does not match selected cattle');
        }

        // Create passport entity without cascade
        const passport = new Passport();
        passport.passportNumber = createPassportDto.passportNumber;
        passport.location = createPassportDto.location;
        passport.issueDate = new Date(createPassportDto.issueDate);
        passport.district = createPassportDto.district;
        passport.applicantName = createPassportDto.applicantName;
        passport.cinNumber = createPassportDto.cinNumber;
        passport.cinIssueDate = new Date(createPassportDto.cinIssueDate);
        passport.cinIssueLocation = createPassportDto.cinIssueLocation;
        passport.purchaseCommune = createPassportDto.purchaseCommune;
        passport.totalCattle = createPassportDto.totalCattle;
        passport.verificationDate = new Date(createPassportDto.verificationDate);
        passport.arreteDate = new Date(createPassportDto.arreteDate);
        passport.herdBookId = createPassportDto.herdBookId;
        passport.status = PassportStatus.DRAFT;
        // Map string fields to legacy fields for backward compatibility
        passport.residenceCommuneLegacy = createPassportDto.residenceCommune;
        passport.villageLegacy = createPassportDto.village;
        passport.communeLegacy = createPassportDto.commune;
        passport.residenceDistrictLegacy = createPassportDto.residenceDistrict;
        passport.regionLegacy = createPassportDto.region;

        // Save passport first
        const savedPassport = await this.passportRawRepository.save(passport);

        // Create herd book cattle passport entries
        const herdBookCattlePassportEntries = herdBookCattle.map((hbc) => {
            const entry = new HerdBookCattlePassport();
            entry.passportId = savedPassport.id;
            entry.herdBookCattleId = hbc.id;
            return entry;
        });

        await this.herdBookCattlePassportRepository.save(herdBookCattlePassportEntries);

        // Return saved passport without reloading to avoid cascade issues
        return savedPassport;
    }

    async findAll(herdBookId?: string): Promise<Passport[]> {
        return await this.passportRepository.findAll(herdBookId);
    }

    async findOne(id: string): Promise<Passport> {
        const passport = await this.passportRepository.findOne(id);
        if (!passport) {
            throw new NotFoundException('Passport not found');
        }
        return passport;
    }

    async update(id: string, updatePassportDto: UpdatePassportDto): Promise<Passport> {
        const passport = await this.findOne(id);
        
        // Map string fields to legacy fields for backward compatibility
        const updateData: Partial<Passport> = {
            passportNumber: updatePassportDto.passportNumber,
            location: updatePassportDto.location,
            issueDate: updatePassportDto.issueDate ? new Date(updatePassportDto.issueDate) : undefined,
            district: updatePassportDto.district,
            applicantName: updatePassportDto.applicantName,
            cinNumber: updatePassportDto.cinNumber,
            cinIssueDate: updatePassportDto.cinIssueDate ? new Date(updatePassportDto.cinIssueDate) : undefined,
            cinIssueLocation: updatePassportDto.cinIssueLocation,
            purchaseCommune: updatePassportDto.purchaseCommune,
            totalCattle: updatePassportDto.totalCattle,
            verificationDate: updatePassportDto.verificationDate ? new Date(updatePassportDto.verificationDate) : undefined,
            arreteDate: updatePassportDto.arreteDate ? new Date(updatePassportDto.arreteDate) : undefined,
            herdBookId: updatePassportDto.herdBookId,
            status: updatePassportDto.status,
            // Map string fields to legacy fields for backward compatibility
            residenceCommuneLegacy: updatePassportDto.residenceCommune,
            villageLegacy: (updatePassportDto as any).village, // Casting to any if updatePassportDto lacks village temporarily
            communeLegacy: updatePassportDto.commune,
            residenceDistrictLegacy: updatePassportDto.residenceDistrict,
            regionLegacy: updatePassportDto.region,
        };
        
        return await this.passportRepository.update(id, updateData);
    }

    async delete(id: string): Promise<void> {
        const passport = await this.findOne(id);
        if (passport.status === 'GENERATED' || passport.status === 'USED') {
            throw new BadRequestException('Cannot delete generated or used passport');
        }
        await this.passportRepository.delete(id);
    }

    async generatePdf(id: string, userId: string): Promise<Passport> {
        const passport = await this.findOne(id);
        
        if (passport.status !== 'DRAFT') {
            throw new BadRequestException('Only draft passports can be generated');
        }

        // Create snapshots for all cattle in the passport
        const snapshots = await Promise.all(
            passport.cattle.map(async (hbc) => {
                const herdBookCattle = await this.herdBookCattleRepository.findOne({
                    where: { id: hbc.herdBookCattleId },
                    relations: ['cattle', 'cattle.character'],
                });

                if (!herdBookCattle?.cattle) {
                    throw new BadRequestException('Cattle data not found');
                }

                const snapshot = this.passportCattleSnapshotRepository.create({
                    passportId: passport.id,
                    herdBookCattleId: hbc.herdBookCattleId,
                    nCarnet: herdBookCattle.nCarnet || '',
                    characterName: herdBookCattle.cattle.character?.name || '',
                    name: herdBookCattle.cattle.name || '',
                    brand: herdBookCattle.cattle.brand || '',
                    quantity: 1,
                    snapshotDate: new Date(),
                });

                return await this.passportCattleSnapshotRepository.save(snapshot);
            })
        );

        // Link snapshots to herd book cattle passport entries
        for (let i = 0; i < passport.cattle.length; i++) {
            const hbc = passport.cattle[i];
            hbc.snapshotId = snapshots[i].id;
            await this.herdBookCattlePassportRepository.save(hbc);
        }

        // Create audit entry
        const audit = this.passportAuditRepository.create({
            passportId: passport.id,
            action: AuditAction.GENERATED,
            previousStatus: passport.status,
            newStatus: PassportStatus.GENERATED,
            userId,
            ipAddress: '', // TODO: Get from request
            userAgent: '', // TODO: Get from request
        });
        await this.passportAuditRepository.save(audit);

        // Generate PDF
        const pdfBuffer = await this.pdfMakeService.generatePassportPdf(passport);

        const updatedPassport = await this.passportRepository.update(id, {
            status: PassportStatus.GENERATED,
            generatedAt: new Date(),
            generatedBy: userId,
            pdfUrl: `passport-${passport.passportNumber}.pdf`,
            qrCode: `QR-${passport.passportNumber}`,
        });

        return updatedPassport;
    }

    async downloadPdf(id: string): Promise<Buffer> {
        const passport = await this.findOne(id);
        
        if (passport.status !== 'GENERATED') {
            throw new BadRequestException('PDF not available for this passport');
        }

        // Generate PDF on the fly
        return await this.pdfMakeService.generatePassportPdf(passport);
    }
}
