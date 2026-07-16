import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { Passport } from './entities/passport.entity';
import { HerdBookCattlePassport } from './entities/herd-book-cattle-passport.entity';
import { PassportCattleSnapshot } from './entities/passport-cattle-snapshot.entity';
import { PassportAudit } from './entities/passport-audit.entity';
import { AuditAction } from './entities/passport-audit.entity';
import { PassportStatus } from './entities/passport.entity';
import { CreatePassportDto } from './dto/create-passport.dto';
import { UpdatePassportDto } from './dto/update-passport.dto';
import { PassportRepository } from './passport.repository';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, In, DataSource, QueryRunner } from 'typeorm';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { PdfMakeService } from './pdf-make.service';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PassportService {
    private readonly logger = new Logger(PassportService.name);

    // Répertoire de stockage des PDFs générés
    private readonly pdfStorageDir = path.join(process.cwd(), 'uploads', 'passports');

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
        private readonly pdfMakeService: PdfMakeService,
        @InjectDataSource()
        private readonly dataSource: DataSource,
    ) {
        // Crée le répertoire de stockage si inexistant
        if (!fs.existsSync(this.pdfStorageDir)) {
            fs.mkdirSync(this.pdfStorageDir, { recursive: true });
        }
    }

    // ─── Création ────────────────────────────────────────────────────────────

    async create(createPassportDto: CreatePassportDto, herdBookCattleIds: string[], _userId?: string): Promise<Passport> {
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

    // ─── Lecture ─────────────────────────────────────────────────────────────

    async findAll(herdBookId?: string, page?: number, limit?: number): Promise<{ data: Passport[], meta: any }> {
        return await this.passportRepository.findAll(herdBookId, page, limit);
    }

    async findOne(id: string): Promise<Passport> {
        const passport = await this.passportRepository.findOne(id);
        if (!passport) {
            throw new NotFoundException('Passport not found');
        }
        return passport;
    }

    // ─── Mise à jour ──────────────────────────────────────────────────────────

    async update(id: string, updatePassportDto: UpdatePassportDto): Promise<Passport> {
        await this.findOne(id);

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
            villageLegacy: (updatePassportDto as any).village,
            communeLegacy: updatePassportDto.commune,
            residenceDistrictLegacy: updatePassportDto.residenceDistrict,
            regionLegacy: updatePassportDto.region,
        };

        return await this.passportRepository.update(id, updateData);
    }

    // ─── Suppression ──────────────────────────────────────────────────────────

    async delete(id: string): Promise<void> {
        const passport = await this.findOne(id);
        if (passport.status === PassportStatus.USED) {
            throw new BadRequestException('Cannot delete used passport');
        }
        await this.passportRepository.delete(id);
    }

    // ─── Génération PDF ───────────────────────────────────────────────────────

    async generatePdf(
        id: string,
        userId: string,
        ipAddress?: string,
        userAgent?: string,
    ): Promise<Passport> {
        const passport = await this.findOne(id);

        if (passport.status !== PassportStatus.DRAFT) {
            throw new BadRequestException('Only draft passports can be generated');
        }

        // Génération du QR Code avec payload contenant le numéro de passeport
        const qrPayload = `PASSEPORT-BOVIN:${passport.passportNumber}:${passport.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: 'M',
        });

        // ── Transaction atomique ─────────────────────────────────────────────
        const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        let pdfBuffer: Buffer;
        let pdfFilePath: string;

        try {
            // 1. Suppression des snapshots existants (re-génération)
            await queryRunner.manager.delete(PassportCattleSnapshot, { passportId: passport.id });

            // 2. Création des snapshots figés au moment de la génération
            const snapshots = await Promise.all(
                passport.cattle.map(async (hbc) => {
                    const herdBookCattle = await this.herdBookCattleRepository.findOne({
                        where: { id: hbc.herdBookCattleId },
                        relations: ['cattle', 'cattle.character'],
                    });

                    if (!herdBookCattle?.cattle) {
                        throw new BadRequestException(
                            `Cattle data not found for herdBookCattleId: ${hbc.herdBookCattleId}`,
                        );
                    }

                    const snapshot = queryRunner.manager.create(PassportCattleSnapshot, {
                        passportId: passport.id,
                        herdBookCattleId: hbc.herdBookCattleId,
                        nCarnet: herdBookCattle.nCarnet || '',
                        characterName: herdBookCattle.cattle.character?.name || '',
                        name: herdBookCattle.cattle.name || '',
                        brand: herdBookCattle.cattle.brand || '',
                        quantity: 1,
                        snapshotDate: new Date(),
                    });

                    return await queryRunner.manager.save(PassportCattleSnapshot, snapshot);
                }),
            );

            // 3. Liaison des snapshots aux entrées HerdBookCattlePassport
            for (let i = 0; i < passport.cattle.length; i++) {
                const hbc = passport.cattle[i];
                hbc.snapshotId = snapshots[i].id;
                await queryRunner.manager.save(HerdBookCattlePassport, hbc);
            }

            // 4. Génération du PDF (en dehors de la transaction car opération externe)
            //    On le fait avant le commit pour rollback en cas d'échec
            pdfBuffer = await this.pdfMakeService.generatePassportPdf(passport, snapshots, qrCodeDataUrl);

            // 5. Persistance du PDF sur le filesystem
            const safePassportNumber = passport.passportNumber.replace(/[^a-zA-Z0-9\-]/g, '_');
            const pdfFileName = `passport-${safePassportNumber}-${Date.now()}.pdf`;
            pdfFilePath = path.join(this.pdfStorageDir, pdfFileName);
            
            const resolvedPath = path.resolve(pdfFilePath);
            const resolvedStorageDir = path.resolve(this.pdfStorageDir);
            if (!resolvedPath.startsWith(resolvedStorageDir + path.sep)) {
                throw new BadRequestException('Invalid file path detected');
            }
            
            fs.writeFileSync(pdfFilePath, pdfBuffer);
            this.logger.log(`PDF saved to: ${pdfFilePath}`);

            // 6. Audit entry
            const audit = queryRunner.manager.create(PassportAudit, {
                passportId: passport.id,
                action: AuditAction.GENERATED,
                previousStatus: passport.status,
                newStatus: PassportStatus.GENERATED,
                userId,
                ipAddress: ipAddress || '',
                userAgent: userAgent || '',
            });
            await queryRunner.manager.save(PassportAudit, audit);

            // 7. Mise à jour du statut et métadonnées
            await queryRunner.manager.update(Passport, id, {
                status: PassportStatus.GENERATED,
                generatedAt: new Date(),
                generatedBy: userId,
                pdfUrl: `uploads/passports/${pdfFileName}`,
                qrCode: qrPayload,
            });

            await queryRunner.commitTransaction();
            this.logger.log(`Passport ${passport.passportNumber} generated successfully`);

        } catch (err) {
            await queryRunner.rollbackTransaction();

            // Nettoyage du fichier PDF si déjà créé avant le rollback
            if (pdfFilePath && fs.existsSync(pdfFilePath)) {
                fs.unlinkSync(pdfFilePath);
            }

            this.logger.error(`Failed to generate passport ${id}: ${err.message}`);
            throw err;
        } finally {
            await queryRunner.release();
        }

        return await this.passportRepository.findOne(id);
    }

    // ─── Preview HTML ────────────────────────────────────────────────────────

    async getPreviewHtml(id: string): Promise<string> {
        const passport = await this.findOne(id);
        
        const qrPayload = passport.qrCode || `PASSEPORT-BOVIN:${passport.passportNumber}:${passport.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: 'M',
        });

        let snapshots: PassportCattleSnapshot[];

        if (passport.status === PassportStatus.DRAFT) {
            // Build in-memory snapshots for preview
            snapshots = await Promise.all(
                passport.cattle.map(async (hbc) => {
                    const herdBookCattle = await this.herdBookCattleRepository.findOne({
                        where: { id: hbc.herdBookCattleId },
                        relations: ['cattle', 'cattle.character'],
                    });

                    return {
                        nCarnet: herdBookCattle?.nCarnet || '',
                        characterName: herdBookCattle?.cattle?.character?.name || '',
                        name: herdBookCattle?.cattle?.name || '',
                        brand: herdBookCattle?.cattle?.brand || '',
                    } as PassportCattleSnapshot;
                })
            );
        } else {
            snapshots = await this.passportCattleSnapshotRepository.find({
                where: { passportId: passport.id },
                order: { snapshotDate: 'ASC' },
            });
        }

        return this.pdfMakeService.renderHtml(passport, snapshots, qrCodeDataUrl);
    }

    // ─── Téléchargement PDF ───────────────────────────────────────────────────

    async downloadPdf(id: string): Promise<Buffer> {
        const passport = await this.findOne(id);

        if (passport.status !== PassportStatus.GENERATED) {
            throw new BadRequestException('PDF not available for this passport');
        }

        // Servir le fichier déjà persisté (pas de re-génération)
        if (passport.pdfUrl) {
            const absolutePath = path.join(process.cwd(), passport.pdfUrl);
            if (fs.existsSync(absolutePath)) {
                return fs.readFileSync(absolutePath);
            }
        }

        // Fallback : re-génération si le fichier est introuvable (migration d'anciens passeports)
        this.logger.warn(`PDF file not found for passport ${id}, regenerating...`);

        const qrPayload = passport.qrCode || `PASSEPORT-BOVIN:${passport.passportNumber}:${passport.id}`;
        const qrCodeDataUrl = await QRCode.toDataURL(qrPayload, {
            width: 150,
            margin: 1,
            errorCorrectionLevel: 'M',
        });

        const snapshots = await this.passportCattleSnapshotRepository.find({
            where: { passportId: passport.id },
            order: { snapshotDate: 'ASC' },
        });

        return await this.pdfMakeService.generatePassportPdf(passport, snapshots, qrCodeDataUrl);
    }
}
