import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';

import { HerdBooksService } from './herd-books.service';
import { HerdBooksRepository } from './herd-books.repository';
import { HerdBooksMapper } from './herd-books.mapper';
import { UserRole } from '../../platform/users/entities/user.entity';
import { CsvImportService } from '../csv-import/csv-import.service';
import { DataSource } from 'typeorm';
import { CategoriesRepository } from '../../platform/categories/categories.repository';
import { StatusRepository } from '../../platform/status/status.repository';
import { CharactersRepository } from '../../platform/characters/characters.repository';
import { Owner } from '../../platform/owners/entities/owner.entity';
import { InitialImportHerdBookDto } from './dto/initial-import-herd-book.dto';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeSuperAdmin = () => ({
  id: 'user-super',
  role: UserRole.SUPER_ADMIN,
  ownerId: null,
});

const makeOwnerUser = (overrides = {}) => ({
  id: 'user-owner',
  role: UserRole.OWNER_USER,
  ownerId: 'owner-1',
  ...overrides,
});

const makeHerdBook = (overrides: any = {}) => ({
  id: 'hb-1',
  reference: 'HB-2024',
  year: 2024,
  description: 'Test herd book',
  ownerId: 'owner-1',
  ...overrides,
});

const makeHerdBooksRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOneWithRelations: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

const makeCsvImportServiceMock = () => ({
  validateFileConstraints: jest.fn(),
  parseAndSanitizeCsv: jest.fn(),
  checkCellInjectionRisk: jest.fn((value: string) => {
    const trimmed = value ? value.trim() : value;
    const hasInjectionRisk = !!trimmed && ['=', '+', '-', '@'].some(p => trimmed.startsWith(p));
    return { value: trimmed, hasInjectionRisk };
  }),
});

const makeDataSourceMock = () => ({
  getRepository: jest.fn(),
  createQueryRunner: jest.fn(),
});

const makeCategoriesRepositoryMock = () => ({
  findByName: jest.fn(),
});

const makeStatusRepositoryMock = () => ({
  findByName: jest.fn(),
});

const makeCharactersRepositoryMock = () => ({
  findByName: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('HerdBooksService', () => {
  let service: HerdBooksService;
  let herdBooksRepo: ReturnType<typeof makeHerdBooksRepoMock>;
  let csvImportService: ReturnType<typeof makeCsvImportServiceMock>;
  let dataSource: ReturnType<typeof makeDataSourceMock>;
  let categoriesRepo: ReturnType<typeof makeCategoriesRepositoryMock>;
  let statusRepo: ReturnType<typeof makeStatusRepositoryMock>;
  let charactersRepo: ReturnType<typeof makeCharactersRepositoryMock>;

  beforeEach(async () => {
    herdBooksRepo = makeHerdBooksRepoMock();
    csvImportService = makeCsvImportServiceMock();
    dataSource = makeDataSourceMock();
    categoriesRepo = makeCategoriesRepositoryMock();
    statusRepo = makeStatusRepositoryMock();
    charactersRepo = makeCharactersRepositoryMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HerdBooksService,
        { provide: HerdBooksRepository, useValue: herdBooksRepo },
        { provide: CsvImportService, useValue: csvImportService },
        { provide: DataSource, useValue: dataSource },
        { provide: CategoriesRepository, useValue: categoriesRepo },
        { provide: StatusRepository, useValue: statusRepo },
        { provide: CharactersRepository, useValue: charactersRepo },
      ],
    }).compile();

    service = module.get(HerdBooksService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('SUPER_ADMIN : passe ownerId null', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      herdBooksRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({} as any, makeSuperAdmin() as any);

      expect(herdBooksRepo.findAllWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: null }),
        expect.any(Object),
      );
    });

    it('OWNER_USER : force ownerId', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      herdBooksRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({} as any, makeOwnerUser() as any);

      expect(herdBooksRepo.findAllWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'owner-1' }),
        expect.any(Object),
      );
    });

    it('OWNER_USER sans ownerId → ForbiddenException', async () => {
      await expect(
        service.findAll({} as any, makeOwnerUser({ ownerId: null }) as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('retourne les données mappées', async () => {
      const hb = makeHerdBook();
      herdBooksRepo.findAllWithRelations.mockResolvedValue({ data: [hb], total: 1, page: 1, limit: 20 });
      jest.spyOn(HerdBooksMapper, 'toResponseList').mockReturnValue([{ id: 'hb-1' }] as any);

      const result = await service.findAll({} as any, makeSuperAdmin() as any);

      expect(result.data).toEqual([{ id: 'hb-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le livre mappé', async () => {
      const hb = makeHerdBook();
      herdBooksRepo.findOneWithRelations.mockResolvedValue(hb);
      jest.spyOn(HerdBooksMapper, 'toResponse').mockReturnValue({ id: 'hb-1' } as any);

      const result = await service.findOne('hb-1', makeSuperAdmin() as any);

      expect(result).toEqual({ id: 'hb-1' });
    });

    it('NotFoundException si absent', async () => {
      herdBooksRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(service.findOne('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un livre et le retourne mappé', async () => {
      const dto = {
        reference: 'HB-NEW',
        year: 2025,
        description: 'New book',
        ownerId: 'owner-1',
      } as any;

      const savedHb = makeHerdBook({ reference: 'HB-NEW' });
      herdBooksRepo.create.mockReturnValue(savedHb);
      herdBooksRepo.save.mockResolvedValue(savedHb);
      herdBooksRepo.findOneWithRelations.mockResolvedValue(savedHb);
      jest.spyOn(HerdBooksMapper, 'toResponse').mockReturnValue({ id: 'hb-new' } as any);

      const result = await service.create(dto, makeSuperAdmin() as any);

      expect(herdBooksRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ reference: 'HB-NEW', year: 2025 }),
      );
      expect(herdBooksRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'hb-new' });
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      herdBooksRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any, makeSuperAdmin() as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne le livre', async () => {
      const hb = makeHerdBook();
      herdBooksRepo.findOneWithRelations.mockResolvedValue(hb);
      herdBooksRepo.save.mockResolvedValue(hb);
      herdBooksRepo.findOneWithRelations.mockResolvedValueOnce(hb).mockResolvedValueOnce(hb);
      jest.spyOn(HerdBooksMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { year: 2026, description: 'Updated' } as any;

      await service.update('hb-1', dto, makeSuperAdmin() as any);

      expect(hb.year).toBe(2026);
      expect(hb.description).toBe('Updated');
      expect(herdBooksRepo.save).toHaveBeenCalledWith(hb);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime et retourne la réponse mappée', async () => {
      const hb = makeHerdBook();
      herdBooksRepo.findOneWithRelations.mockResolvedValue(hb);
      herdBooksRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(HerdBooksMapper, 'toResponse').mockReturnValue({ id: 'hb-1' } as any);

      const result = await service.remove('hb-1', makeSuperAdmin() as any);

      expect(herdBooksRepo.remove).toHaveBeenCalledWith(hb);
      expect(result).toEqual({ id: 'hb-1' });
    });

    it('NotFoundException si absent', async () => {
      herdBooksRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(service.remove('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── dryRunInitialImport ──────────────────────────

  describe('dryRunInitialImport()', () => {
    const makeOwnerAdmin = () => ({
      id: 'user-owner-admin',
      role: UserRole.OWNER_ADMIN,
      ownerId: 'owner-1',
    });

    const makeValidCsvBuffer = () => Buffer.from(
      'n_carnet;name;nickname;gender;birth_date;character;brand;distinctive_sign;source_type;category;status\n' +
      '1;Vache1;;F;15/01/2020;Calme;;Marque rouge;NE_DANS_TROUPEAU;Laitière;Actif\n' +
      '2;Taureau1;;M;10/03/2019;;Bleu;;ACHETE;Reproducteur;Actif',
      'utf8',
    );

    it('OWNER_USER → ForbiddenException', async () => {
      const user = makeOwnerUser();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      await expect(service.dryRunInitialImport(dto, file, user as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('SUPER_ADMIN → ForbiddenException', async () => {
      const user = makeSuperAdmin();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      await expect(service.dryRunInitialImport(dto, file, user as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('User sans ownerId → ForbiddenException', async () => {
      const user = { ...makeOwnerAdmin(), ownerId: null };
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      await expect(service.dryRunInitialImport(dto, file, user as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('hasCompletedInitialImport déjà true → ForbiddenException', async () => {
      const user = makeOwnerAdmin();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      const mockOwner = { id: 'owner-1', hasCompletedInitialImport: true };
      const mockRepo = { findOne: jest.fn().mockResolvedValue(mockOwner) };
      dataSource.getRepository.mockReturnValue(mockRepo);

      await expect(service.dryRunInitialImport(dto, file, user as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('Plus de 100 lignes → BadRequestException', async () => {
      const user = makeOwnerAdmin();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      const mockOwner = { id: 'owner-1', hasCompletedInitialImport: false };
      const mockRepo = { findOne: jest.fn().mockResolvedValue(mockOwner) };
      dataSource.getRepository.mockReturnValue(mockRepo);

      const rows = Array.from({ length: 101 }, () => ({ n_carnet: '1', name: 'Test', gender: 'F', birth_date: '01/01/2020', source_type: 'NE_DANS_TROUPEAU', category: 'Test', status: 'Test' }));
      csvImportService.validateFileConstraints.mockImplementation(() => {});
      csvImportService.parseAndSanitizeCsv.mockResolvedValue(rows);
      categoriesRepo.findByName.mockResolvedValue({ id: 'cat-1' });
      statusRepo.findByName.mockResolvedValue({ id: 'status-1' });

      await expect(service.dryRunInitialImport(dto, file, user as any))
        .rejects.toThrow(BadRequestException);
    });

    it('CSV valide → retourne valid: true', async () => {
      const user = makeOwnerAdmin();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      const mockOwner = { id: 'owner-1', hasCompletedInitialImport: false };
      const mockRepo = { findOne: jest.fn().mockResolvedValue(mockOwner) };
      dataSource.getRepository.mockReturnValue(mockRepo);

      const rows = [
        { n_carnet: '1', name: 'Vache1', gender: 'F', birth_date: '15/01/2020', source_type: 'NE_DANS_TROUPEAU', category: 'Laitière', status: 'Actif' },
      ];
      csvImportService.validateFileConstraints.mockImplementation(() => {});
      csvImportService.parseAndSanitizeCsv.mockResolvedValue(rows);
      categoriesRepo.findByName.mockResolvedValue({ id: 'cat-1' });
      statusRepo.findByName.mockResolvedValue({ id: 'status-1' });

      const result = await service.dryRunInitialImport(dto, file, user as any);

      expect(result.valid).toBe(true);
      expect(result.totalRows).toBe(1);
      expect(result.validRowsCount).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    it('CSV avec erreurs → retourne valid: false avec erreurs', async () => {
      const user = makeOwnerAdmin();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      const mockOwner = { id: 'owner-1', hasCompletedInitialImport: false };
      const mockRepo = { findOne: jest.fn().mockResolvedValue(mockOwner) };
      dataSource.getRepository.mockReturnValue(mockRepo);

      const rows = [
        { n_carnet: 'abc', name: 'Vache1', gender: 'X', birth_date: 'invalid', source_type: 'INVALID', category: 'Unknown', status: 'Unknown' },
      ];
      csvImportService.validateFileConstraints.mockImplementation(() => {});
      csvImportService.parseAndSanitizeCsv.mockResolvedValue(rows);
      categoriesRepo.findByName.mockResolvedValue(null);
      statusRepo.findByName.mockResolvedValue(null);

      const result = await service.dryRunInitialImport(dto, file, user as any);

      expect(result.valid).toBe(false);
      expect(result.totalRows).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('Une seule ligne avec un champ à risque d\'injection n\'interrompt pas le rapport — l\'erreur apparaît de façon ciblée, les autres lignes restent traitées', async () => {
      const user = makeOwnerAdmin();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      const mockOwner = { id: 'owner-1', hasCompletedInitialImport: false };
      const mockRepo = { findOne: jest.fn().mockResolvedValue(mockOwner) };
      dataSource.getRepository.mockReturnValue(mockRepo);

      const rows = [
        { n_carnet: '1', name: 'Vache1', gender: 'F', birth_date: '15/01/2020', source_type: 'NE_DANS_TROUPEAU', category: 'Laitière', status: 'Actif', brand: '=cmd|/c calc' },
        { n_carnet: '2', name: 'Vache2', gender: 'F', birth_date: '15/01/2020', source_type: 'NE_DANS_TROUPEAU', category: 'Laitière', status: 'Actif' },
      ];
      csvImportService.validateFileConstraints.mockImplementation(() => {});
      csvImportService.parseAndSanitizeCsv.mockResolvedValue(rows);
      categoriesRepo.findByName.mockResolvedValue({ id: 'cat-1' });
      statusRepo.findByName.mockResolvedValue({ id: 'status-1' });

      // Ne doit jamais lever d'exception globale — juste rapporter l'erreur ciblée
      const result = await service.dryRunInitialImport(dto, file, user as any);

      expect(result.valid).toBe(false);
      expect(result.totalRows).toBe(2);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'brand' }),
        ]),
      );
      const rowNumberOfError = result.errors.find((e: any) => e.field === 'brand').rowNumber;
      // La 2e ligne de données, elle, ne doit avoir aucune erreur reportée
      const otherRowErrors = result.errors.filter((e: any) => e.rowNumber !== rowNumberOfError);
      expect(otherRowErrors).toHaveLength(0);
    });
  });

  // ── confirmInitialImport ─────────────────────────

  describe('confirmInitialImport()', () => {
    const makeOwnerAdmin = () => ({
      id: 'user-owner-admin',
      role: UserRole.OWNER_ADMIN,
      ownerId: 'owner-1',
    });

    const makeValidCsvBuffer = () => Buffer.from(
      'n_carnet;name;nickname;gender;birth_date;character;brand;distinctive_sign;source_type;category;status\n' +
      '1;Vache1;;F;15/01/2020;Calme;;Marque rouge;NE_DANS_TROUPEAU;Laitière;Actif',
      'utf8',
    );

    it('dry-run avec erreurs → BadRequestException', async () => {
      const user = makeOwnerAdmin();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      const mockOwner = { id: 'owner-1', hasCompletedInitialImport: false };
      const mockRepo = { findOne: jest.fn().mockResolvedValue(mockOwner) };
      dataSource.getRepository.mockReturnValue(mockRepo);

      const rows = [{ n_carnet: 'abc', name: 'Vache1', gender: 'X', birth_date: 'invalid', source_type: 'INVALID', category: 'Unknown', status: 'Unknown' }];
      csvImportService.validateFileConstraints.mockImplementation(() => {});
      csvImportService.parseAndSanitizeCsv.mockResolvedValue(rows);
      categoriesRepo.findByName.mockResolvedValue(null);
      statusRepo.findByName.mockResolvedValue(null);

      await expect(service.confirmInitialImport(dto, file, user as any))
        .rejects.toThrow(BadRequestException);
    });

    it('Succès → crée HerdBook, Cattle, HerdBookCattle et update Owner', async () => {
      const user = makeOwnerAdmin();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      const mockOwner = { id: 'owner-1', hasCompletedInitialImport: false };
      const mockRepo = { findOne: jest.fn().mockResolvedValue(mockOwner) };
      dataSource.getRepository.mockReturnValue(mockRepo);

      const rows = [{ n_carnet: '1', name: 'Vache1', gender: 'F', birth_date: '15/01/2020', source_type: 'NE_DANS_TROUPEAU', category: 'Laitière', status: 'Actif' }];
      csvImportService.validateFileConstraints.mockImplementation(() => {});
      csvImportService.parseAndSanitizeCsv.mockResolvedValue(rows);
      categoriesRepo.findByName.mockResolvedValue({ id: 'cat-1' });
      statusRepo.findByName.mockResolvedValue({ id: 'status-1' });

      const mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        manager: {
          create: jest.fn((entity, data) => ({ ...data, id: 'test-id' })),
          save: jest.fn().mockResolvedValue({ id: 'test-id' }),
          update: jest.fn().mockResolvedValue(undefined),
        },
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      };
      dataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      const result = await service.confirmInitialImport(dto, file, user as any);

      expect(result.herdBookId).toBeDefined();
      expect(result.cattleCount).toBe(1);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });

    it('Erreur en cours de transaction → rollback', async () => {
      const user = makeOwnerAdmin();
      const dto = { reference: 'HB-2024', year: 2024 } as InitialImportHerdBookDto;
      const file = { buffer: makeValidCsvBuffer(), originalname: 'test.csv', mimetype: 'text/csv', size: 1024 } as Express.Multer.File;

      const mockOwner = { id: 'owner-1', hasCompletedInitialImport: false };
      const mockRepo = { findOne: jest.fn().mockResolvedValue(mockOwner) };
      dataSource.getRepository.mockReturnValue(mockRepo);

      const rows = [{ n_carnet: '1', name: 'Vache1', gender: 'F', birth_date: '15/01/2020', source_type: 'NE_DANS_TROUPEAU', category: 'Laitière', status: 'Actif' }];
      csvImportService.validateFileConstraints.mockImplementation(() => {});
      csvImportService.parseAndSanitizeCsv.mockResolvedValue(rows);
      categoriesRepo.findByName.mockResolvedValue({ id: 'cat-1' });
      statusRepo.findByName.mockResolvedValue({ id: 'status-1' });

      const mockQueryRunner = {
        connect: jest.fn().mockResolvedValue(undefined),
        startTransaction: jest.fn().mockResolvedValue(undefined),
        manager: {
          create: jest.fn((entity, data) => ({ ...data, id: 'test-id' })),
          save: jest.fn().mockRejectedValue(new Error('DB Error')),
          update: jest.fn().mockResolvedValue(undefined),
        },
        commitTransaction: jest.fn().mockResolvedValue(undefined),
        rollbackTransaction: jest.fn().mockResolvedValue(undefined),
        release: jest.fn().mockResolvedValue(undefined),
      };
      dataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

      await expect(service.confirmInitialImport(dto, file, user as any))
        .rejects.toThrow('DB Error');

      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  // ── generateCsvTemplate ───────────────────────────

  describe('generateCsvTemplate()', () => {
    it('génère un buffer CSV valide', async () => {
      const buffer = await service.generateCsvTemplate();

      expect(buffer).toBeInstanceOf(Buffer);
      const content = buffer.toString('utf8');
      expect(content).toContain('n_carnet');
      expect(content).toContain('name');
      expect(content).toContain('gender');
      expect(content).toContain('Vache1');
      expect(content).toContain('Taureau1');
      expect(content).toContain('\uFEFF'); // BOM
    });

    it('contient les en-têtes attendus', async () => {
      const buffer = await service.generateCsvTemplate();
      const content = buffer.toString('utf8');

      const headers = ['n_carnet', 'name', 'nickname', 'gender', 'birth_date', 'character', 'brand', 'distinctive_sign', 'source_type', 'category', 'status'];
      headers.forEach(header => {
        expect(content).toContain(header);
      });
    });

    it('contient 2 lignes d\'exemple', async () => {
      const buffer = await service.generateCsvTemplate();
      const content = buffer.toString('utf8');

      const lines = content.split('\n').filter(line => line.trim() !== '');
      expect(lines.length).toBeGreaterThanOrEqual(3); // header + 2 examples
    });
  });
});
