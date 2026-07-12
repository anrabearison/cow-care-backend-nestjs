import { Test, TestingModule } from '@nestjs/testing';
import { PassportService } from './passport.service';
import { PassportRepository } from './passport.repository';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Passport } from './entities/passport.entity';
import { HerdBookCattlePassport } from './entities/herd-book-cattle-passport.entity';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { PassportCattleSnapshot } from './entities/passport-cattle-snapshot.entity';
import { PdfMakeService } from './pdf-make.service';
import { DataSource } from 'typeorm';
import { PassportStatus } from './entities/passport.entity';
import * as path from 'path';

jest.mock('puppeteer', () => ({}));

describe('PassportService', () => {
    let service: PassportService;
    let testingModule: TestingModule;

    beforeEach(async () => {
        testingModule = await Test.createTestingModule({
            providers: [
                PassportService,
                { provide: PassportRepository, useValue: { findOne: jest.fn() } },
                { provide: getRepositoryToken(Passport), useValue: {} },
                { provide: getRepositoryToken(HerdBookCattlePassport), useValue: {} },
                { provide: getRepositoryToken(HerdBookCattle), useValue: {} },
                { provide: getRepositoryToken(PassportCattleSnapshot), useValue: {} },
                { provide: PdfMakeService, useValue: { generatePassportPdf: jest.fn() } },
                { provide: DataSource, useValue: { createQueryRunner: jest.fn() } },
            ],
        }).compile();

        service = testingModule.get<PassportService>(PassportService);
    });

    it('should prevent path traversal in generatePdf by sanitizing the passportNumber', async () => {
        // We mock findOne to return a malicious passport number
        jest.spyOn(service, 'findOne').mockResolvedValue({
            id: 'test-id',
            passportNumber: '../../../etc/evil',
            status: PassportStatus.DRAFT,
            cattle: [],
        } as any);

        // We mock the database transaction flow to focus on the file creation logic
        const queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            manager: {
                delete: jest.fn(),
                create: jest.fn(),
                save: jest.fn(),
                update: jest.fn(),
            },
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
        };

        const dataSource = testingModule.get<DataSource>(DataSource);
        jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(queryRunner as any);

        const pdfMakeService = testingModule.get<PdfMakeService>(PdfMakeService);
        jest.spyOn(pdfMakeService, 'generatePassportPdf').mockResolvedValue(Buffer.from('test'));

        const passportRepository = testingModule.get<PassportRepository>(PassportRepository);
        jest.spyOn(passportRepository, 'findOne').mockResolvedValue({} as any);

        // the safe passport number replaces '/' and '.' with '_'
        // so '../../../etc/evil' becomes '_________etc_evil'
        // the resolved path should be within pdfStorageDir

        const fs = require('fs');
        const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
        
        await service.generatePdf('test-id', 'user-id');

        // Verify that the generated filename was sanitized and didn't use the original malicious path
        const calls = writeFileSyncSpy.mock.calls;
        const pdfFilePathArg = calls.find(args => (args[0] as string).includes('_________etc_evil'));
        expect(pdfFilePathArg).toBeDefined();

        writeFileSyncSpy.mockRestore();
    });
});
