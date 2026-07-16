import { Test, TestingModule } from '@nestjs/testing';
import { PassportService } from './passport.service';
import { PassportRepository } from './passport.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Passport, PassportStatus } from './entities/passport.entity';
import { HerdBookCattlePassport } from './entities/herd-book-cattle-passport.entity';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { PassportCattleSnapshot } from './entities/passport-cattle-snapshot.entity';
import { PdfMakeService } from './pdf-make.service';
import { DataSource, Repository, QueryRunner } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as path from 'path';

// Mocks
jest.mock('puppeteer', () => ({}));
jest.mock('fs', () => {
    const actualFs = jest.requireActual('fs');
    return {
        ...actualFs,
        existsSync: jest.fn(),
        mkdirSync: jest.fn(),
        writeFileSync: jest.fn(),
        readFileSync: jest.fn(),
        unlinkSync: jest.fn(),
    };
});

import * as fs from 'fs';

describe('PassportService', () => {
    let service: PassportService;
    let testingModule: TestingModule;
    let passportRepository: jest.Mocked<PassportRepository>;
    let passportRawRepository: jest.Mocked<Repository<Passport>>;
    let herdBookCattleRepository: jest.Mocked<Repository<HerdBookCattle>>;
    let herdBookCattlePassportRepository: jest.Mocked<Repository<HerdBookCattlePassport>>;
    let passportCattleSnapshotRepository: jest.Mocked<Repository<PassportCattleSnapshot>>;
    let pdfMakeService: jest.Mocked<PdfMakeService>;
    let dataSource: jest.Mocked<DataSource>;
    let queryRunner: any;

    beforeEach(async () => {
        // Reset all mocks
        jest.clearAllMocks();

        queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            manager: {
                delete: jest.fn().mockResolvedValue(undefined),
                create: jest.fn((entity, partial) => partial),
                save: jest.fn().mockImplementation(async (...args) => {
                    const entity = args.length > 1 ? args[1] : args[0];
                    return { id: 'snapshot-id', ...entity };
                }),
                update: jest.fn().mockResolvedValue(undefined),
            },
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
        };

        const mockDataSource = {
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        };

        const mockPassportRepository = {
            findByPassportNumber: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };

        const mockRepository = () => ({
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
        });

        const mockPdfMakeService = {
            generatePassportPdf: jest.fn(),
            renderHtml: jest.fn(),
        };

        testingModule = await Test.createTestingModule({
            providers: [
                PassportService,
                { provide: PassportRepository, useValue: mockPassportRepository },
                { provide: getRepositoryToken(Passport), useFactory: mockRepository },
                { provide: getRepositoryToken(HerdBookCattlePassport), useFactory: mockRepository },
                { provide: getRepositoryToken(HerdBookCattle), useFactory: mockRepository },
                { provide: getRepositoryToken(PassportCattleSnapshot), useFactory: mockRepository },
                { provide: PdfMakeService, useValue: mockPdfMakeService },
                { provide: DataSource, useValue: mockDataSource },
            ],
        }).compile();

        service = testingModule.get<PassportService>(PassportService);
        passportRepository = testingModule.get(PassportRepository);
        passportRawRepository = testingModule.get(getRepositoryToken(Passport));
        herdBookCattleRepository = testingModule.get(getRepositoryToken(HerdBookCattle));
        herdBookCattlePassportRepository = testingModule.get(getRepositoryToken(HerdBookCattlePassport));
        passportCattleSnapshotRepository = testingModule.get(getRepositoryToken(PassportCattleSnapshot));
        pdfMakeService = testingModule.get(PdfMakeService);
        dataSource = testingModule.get(DataSource);
        
        // Mock fs default behaviors
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
        jest.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from('existing-pdf'));
    });

    describe('create()', () => {
        const createDto = {
            passportNumber: 'PASS-2026-001',
            location: 'Test Location',
            issueDate: '2026-01-01',
            district: 'Test District',
            applicantName: 'Test Applicant',
            cinNumber: '123456789',
            cinIssueDate: '2026-01-01',
            cinIssueLocation: 'Test Location',
            residenceCommune: 'Commune',
            village: 'Village',
            commune: 'Commune',
            residenceDistrict: 'District',
            region: 'Region',
            purchaseCommune: 'Commune',
            totalCattle: 2,
            verificationDate: '2026-01-01',
            arreteDate: '2026-01-01',
            herdBookId: 'hb-1',
        };
        const herdBookCattleIds = ['cattle-1', 'cattle-2'];

        it('should successfully create a passport', async () => {
            passportRepository.findByPassportNumber.mockResolvedValue(null);
            herdBookCattleRepository.find.mockResolvedValue([
                { id: 'cattle-1', herdBookId: 'hb-1' },
                { id: 'cattle-2', herdBookId: 'hb-1' },
            ] as any);
            
            passportRawRepository.save.mockResolvedValue({ id: 'new-passport-id', ...createDto } as any);
            herdBookCattlePassportRepository.save.mockResolvedValue([] as any);

            const result = await service.create(createDto as any, herdBookCattleIds);

            expect(passportRawRepository.save).toHaveBeenCalled();
            expect(herdBookCattlePassportRepository.save).toHaveBeenCalled();
            expect(result.id).toEqual('new-passport-id');
        });

        it('should throw BadRequestException if passport number already exists', async () => {
            passportRepository.findByPassportNumber.mockResolvedValue({ id: 'existing' } as any);

            await expect(service.create(createDto as any, herdBookCattleIds))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if some cattle are not found', async () => {
            passportRepository.findByPassportNumber.mockResolvedValue(null);
            // Only returns 1 out of 2
            herdBookCattleRepository.find.mockResolvedValue([{ id: 'cattle-1', herdBookId: 'hb-1' }] as any);

            await expect(service.create(createDto as any, herdBookCattleIds))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if cattle belong to different herd books', async () => {
            passportRepository.findByPassportNumber.mockResolvedValue(null);
            herdBookCattleRepository.find.mockResolvedValue([
                { id: 'cattle-1', herdBookId: 'hb-1' },
                { id: 'cattle-2', herdBookId: 'hb-2' },
            ] as any);

            await expect(service.create(createDto as any, herdBookCattleIds))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if herdBookId does not match cattle herdBookId', async () => {
            passportRepository.findByPassportNumber.mockResolvedValue(null);
            herdBookCattleRepository.find.mockResolvedValue([
                { id: 'cattle-1', herdBookId: 'hb-2' },
                { id: 'cattle-2', herdBookId: 'hb-2' },
            ] as any);

            await expect(service.create(createDto as any, herdBookCattleIds))
                .rejects.toThrow(BadRequestException);
        });

        it('should throw BadRequestException if totalCattle does not match provided ids', async () => {
            passportRepository.findByPassportNumber.mockResolvedValue(null);
            herdBookCattleRepository.find.mockResolvedValue([
                { id: 'cattle-1', herdBookId: 'hb-1' },
            ] as any);

            const dtoWrongCount = { ...createDto, totalCattle: 2 };
            
            await expect(service.create(dtoWrongCount as any, ['cattle-1']))
                .rejects.toThrow(BadRequestException);
        });
    });

    describe('findOne()', () => {
        it('should return passport if it exists', async () => {
            const passport = { id: 'p-1', passportNumber: '123' };
            passportRepository.findOne.mockResolvedValue(passport as any);

            const result = await service.findOne('p-1');
            expect(result).toEqual(passport);
        });

        it('should throw NotFoundException if passport does not exist', async () => {
            passportRepository.findOne.mockResolvedValue(null);

            await expect(service.findOne('p-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('delete()', () => {
        it('should delete a draft passport successfully', async () => {
            passportRepository.findOne.mockResolvedValue({ id: 'p-1', status: PassportStatus.DRAFT } as any);
            passportRepository.delete.mockResolvedValue(undefined);

            await service.delete('p-1');
            expect(passportRepository.delete).toHaveBeenCalledWith('p-1');
        });

        it('should throw BadRequestException if passport is USED', async () => {
            passportRepository.findOne.mockResolvedValue({ id: 'p-1', status: PassportStatus.USED } as any);

            await expect(service.delete('p-1')).rejects.toThrow(BadRequestException);
        });
    });

    describe('generatePdf()', () => {
        const passportData = {
            id: 'p-1',
            passportNumber: 'PASS-123',
            status: PassportStatus.DRAFT,
            cattle: [{ herdBookCattleId: 'hbc-1' }],
        };

        const cattleData = {
            id: 'hbc-1',
            nCarnet: 'C-1',
            cattle: { name: 'Bessy', brand: 'X', character: { name: 'Calm' } }
        };

        beforeEach(() => {
            passportRepository.findOne.mockResolvedValue(passportData as any);
            herdBookCattleRepository.findOne.mockResolvedValue(cattleData as any);
            pdfMakeService.generatePassportPdf.mockResolvedValue(Buffer.from('pdf-content'));
        });

        it('should successfully generate PDF, save file, and commit transaction', async () => {
            await service.generatePdf('p-1', 'user-1', '127.0.0.1', 'jest');

            expect(queryRunner.startTransaction).toHaveBeenCalled();
            expect(queryRunner.manager.delete).toHaveBeenCalled();
            expect(pdfMakeService.generatePassportPdf).toHaveBeenCalled();
            
            // Should write to file
            expect(fs.writeFileSync).toHaveBeenCalled();
            const filePathArg = (fs.writeFileSync as jest.Mock).mock.calls[0][0];
            expect(filePathArg).toContain('passport-PASS-123-');
            
            expect(queryRunner.manager.update).toHaveBeenCalled();
            expect(queryRunner.commitTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
        });

        it('should rollback and delete file if PDF generation fails', async () => {
            pdfMakeService.generatePassportPdf.mockRejectedValue(new Error('PDF error'));

            await expect(service.generatePdf('p-1', 'user-1')).rejects.toThrow('PDF error');

            expect(queryRunner.startTransaction).toHaveBeenCalled();
            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
            
            // If file was not yet written, unlink is not called because pdfMakeService failed first
            expect(fs.unlinkSync).not.toHaveBeenCalled(); 
        });
        
        it('should rollback and delete file if an error occurs AFTER file generation', async () => {
            queryRunner.manager.update.mockRejectedValue(new Error('DB Error'));
            
            await expect(service.generatePdf('p-1', 'user-1')).rejects.toThrow('DB Error');
            
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
            // File cleanup should happen
            expect(fs.unlinkSync).toHaveBeenCalled();
            expect(queryRunner.release).toHaveBeenCalled();
        });

        it('should prevent path traversal by sanitizing passportNumber', async () => {
            passportRepository.findOne.mockResolvedValue({
                ...passportData,
                passportNumber: '../../../etc/evil'
            } as any);

            await service.generatePdf('p-1', 'user-1');

            const filePathArg = (fs.writeFileSync as jest.Mock).mock.calls[0][0];
            // Sanitization replaces '.' and '/' with '_'
            expect(filePathArg).toContain('_________etc_evil');
            expect(filePathArg).not.toContain('../');
        });

        it('should throw BadRequestException if passport is not DRAFT', async () => {
            passportRepository.findOne.mockResolvedValue({ ...passportData, status: PassportStatus.GENERATED } as any);

            await expect(service.generatePdf('p-1', 'user-1')).rejects.toThrow(BadRequestException);
            expect(queryRunner.startTransaction).not.toHaveBeenCalled();
        });
    });

    describe('downloadPdf()', () => {
        it('should return existing PDF buffer if file exists', async () => {
            passportRepository.findOne.mockResolvedValue({
                id: 'p-1',
                status: PassportStatus.GENERATED,
                pdfUrl: 'uploads/passports/test.pdf'
            } as any);
            
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('existing-pdf'));

            const result = await service.downloadPdf('p-1');

            expect(result).toEqual(Buffer.from('existing-pdf'));
            expect(fs.readFileSync).toHaveBeenCalled();
            expect(pdfMakeService.generatePassportPdf).not.toHaveBeenCalled();
        });

        it('should regenerate PDF if file is missing (fallback)', async () => {
            passportRepository.findOne.mockResolvedValue({
                id: 'p-1',
                passportNumber: 'PASS-123',
                status: PassportStatus.GENERATED,
                pdfUrl: 'uploads/passports/test.pdf'
            } as any);
            
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            passportCattleSnapshotRepository.find.mockResolvedValue([]);
            pdfMakeService.generatePassportPdf.mockResolvedValue(Buffer.from('regenerated-pdf'));

            const result = await service.downloadPdf('p-1');

            expect(result).toEqual(Buffer.from('regenerated-pdf'));
            expect(fs.readFileSync).not.toHaveBeenCalled();
            expect(pdfMakeService.generatePassportPdf).toHaveBeenCalled();
        });

        it('should throw BadRequestException if passport is not GENERATED', async () => {
            passportRepository.findOne.mockResolvedValue({
                id: 'p-1',
                status: PassportStatus.DRAFT
            } as any);

            await expect(service.downloadPdf('p-1')).rejects.toThrow(BadRequestException);
        });
    });
});
