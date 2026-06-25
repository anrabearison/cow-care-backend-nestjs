import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { CattleService } from './cattle.service';
import { CattleRepository } from './cattle.repository';
import { CattleMapper } from './cattle.mapper';
import { EventsService } from '../events/events.service';
import { TreatmentsService } from '../treatments/treatments.service';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { Event as EventEntity } from '../events/entities/event.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { EventType } from '../event-types/entities/event-type.entity';
import { Gender, SourceType } from './entities/cattle.entity';
import { UserRole } from '../users/entities/user.entity';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeSuperAdmin = (overrides = {}) => ({
  id: 'user-super',
  role: UserRole.SUPER_ADMIN,
  ownerId: null,
  ...overrides,
});

const makeOwnerUser = (overrides = {}) => ({
  id: 'user-owner',
  role: UserRole.OWNER_USER,
  ownerId: 'owner-1',
  ...overrides,
});

const makeCattle = (overrides = {}) => ({
  id: 'cattle-1',
  name: 'Feno',
  gender: Gender.M,
  birthDate: new Date('2022-01-01'),
  sourceType: SourceType.ACHETE,
  sourceSupplier: null,
  sourcePurchaseDate: null,
  sourcePurchasePrice: null,
  sourcePurchaseWeight: null,
  sourcePurchaseHealthStatus: null,
  sourcePurchaseNotes: null,
  sourceMotherId: null,
  events: [],
  treatments: [],
  herdBookEntries: [],
  character: null,
  ...overrides,
});

// ──────────────────────────────────────────────
//  Mock factories
// ──────────────────────────────────────────────

const makeCattleRepositoryMock = () => ({
  findAllWithRelations: jest.fn(),
  findOneWithRelations: jest.fn(),
  findOneWithBasicRelations: jest.fn(),
  findOneForUpdate: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  manager: {},
});

const makeDataSourceMock = () => ({
  transaction: jest.fn((cb: (em: any) => Promise<any>) => cb(makeEntityManagerMock())),
});

const makeEntityManagerMock = () => ({
  save: jest.fn(),
  remove: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  create: jest.fn((Entity: any, data: any) => data),
});

const makeRepositoryMock = () => ({
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('CattleService', () => {
  let service: CattleService;
  let cattleRepo: ReturnType<typeof makeCattleRepositoryMock>;
  let dataSource: ReturnType<typeof makeDataSourceMock>;
  let herdBookCattleRepo: ReturnType<typeof makeRepositoryMock>;
  let eventsService: { updateCattleEvents: jest.Mock };
  let treatmentsService: { updateCattleTreatments: jest.Mock };

  beforeEach(async () => {
    cattleRepo = makeCattleRepositoryMock();
    dataSource = makeDataSourceMock();
    herdBookCattleRepo = makeRepositoryMock();
    eventsService = { updateCattleEvents: jest.fn() };
    treatmentsService = { updateCattleTreatments: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CattleService,
        { provide: CattleRepository, useValue: cattleRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(HerdBookCattle), useValue: herdBookCattleRepo },
        { provide: getRepositoryToken(EventEntity), useValue: makeRepositoryMock() },
        { provide: getRepositoryToken(Treatment), useValue: makeRepositoryMock() },
        { provide: getRepositoryToken(EventType), useValue: makeRepositoryMock() },
        { provide: EventsService, useValue: eventsService },
        { provide: TreatmentsService, useValue: treatmentsService },
      ],
    }).compile();

    service = module.get(CattleService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('SUPER_ADMIN : passe ownerId null quand aucun filtre', async () => {
      const user = makeSuperAdmin();
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      cattleRepo.findAllWithRelations.mockResolvedValue(mockResult);

      const result = await service.findAll({} as any, user as any);

      expect(cattleRepo.findAllWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: null }),
        expect.any(Object),
      );
      expect(result.data).toEqual([]);
    });

    it('SUPER_ADMIN : peut filtrer par ownerId explicite', async () => {
      const user = makeSuperAdmin();
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      cattleRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({ ownerId: 'owner-X' } as any, user as any);

      expect(cattleRepo.findAllWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'owner-X' }),
        expect.any(Object),
      );
    });

    it('OWNER_USER : force ownerId à celui du user', async () => {
      const user = makeOwnerUser();
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      cattleRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({} as any, user as any);

      expect(cattleRepo.findAllWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'owner-1' }),
        expect.any(Object),
      );
    });

    it('OWNER_USER sans ownerId → ForbiddenException', async () => {
      const user = makeOwnerUser({ ownerId: null });

      await expect(service.findAll({} as any, user as any)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le bovin mappé quand il existe', async () => {
      const cattle = makeCattle();
      cattleRepo.findOneWithRelations.mockResolvedValue(cattle);
      jest.spyOn(CattleMapper, 'toResponse').mockReturnValue({ id: 'cattle-1' } as any);

      const result = await service.findOne('cattle-1', makeSuperAdmin() as any);

      expect(result).toEqual({ id: 'cattle-1' });
      expect(cattleRepo.findOneWithRelations).toHaveBeenCalledWith('cattle-1');
    });

    it('NotFoundException si bovin absent', async () => {
      cattleRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(service.findOne('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime et retourne la réponse mappée', async () => {
      const cattle = makeCattle();
      cattleRepo.findOneWithBasicRelations.mockResolvedValue(cattle);
      cattleRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(CattleMapper, 'toResponse').mockReturnValue({ id: 'cattle-1' } as any);

      const result = await service.remove('cattle-1', makeSuperAdmin() as any);

      expect(cattleRepo.remove).toHaveBeenCalledWith(cattle);
      expect(result).toEqual({ id: 'cattle-1' });
    });

    it('NotFoundException si bovin absent', async () => {
      cattleRepo.findOneWithBasicRelations.mockResolvedValue(null);

      await expect(service.remove('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un bovin et l\'enregistre dans le herd book si herdBookId fourni', async () => {
      const mockEm = makeEntityManagerMock();
      dataSource.transaction = jest.fn((cb: any) => cb(mockEm));

      const dto = {
        name: 'Bella',
        gender: Gender.F,
        birthDate: new Date('2024-01-01'),
        herdBookId: 'hb-1',
        source: { type: 'ACHETE' },
      } as any;

      const mockCattle = makeCattle({ id: 'new-cattle' });
      cattleRepo.create.mockReturnValue(mockCattle);
      mockEm.save.mockResolvedValue(mockCattle);
      herdBookCattleRepo.create.mockReturnValue({ id: 'entry-1' });
      mockEm.save.mockResolvedValue({ id: 'entry-1' });

      const transCattleRepo = Object.create(cattleRepo);
      transCattleRepo.findOneWithBasicRelations = jest.fn().mockResolvedValue(mockCattle);
      jest.spyOn(Object, 'create').mockImplementation(() => transCattleRepo);

      jest.spyOn(CattleMapper, 'toResponse').mockReturnValue({ id: 'new-cattle' } as any);

      const result = await service.create(dto, makeSuperAdmin() as any);

      expect(cattleRepo.create).toHaveBeenCalled();
      expect(mockEm.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'new-cattle' });

      jest.restoreAllMocks();
    });

    it('génère un UUID pour le nouveau bovin', async () => {
      const mockEm = makeEntityManagerMock();
      dataSource.transaction = jest.fn((cb: any) => cb(mockEm));

      const dto = {
        name: 'Bella',
        gender: Gender.F,
        birthDate: new Date('2024-01-01'),
      } as any;

      const mockCattle = makeCattle();
      cattleRepo.create.mockReturnValue(mockCattle);
      mockEm.save.mockResolvedValue(mockCattle);

      const transCattleRepo = Object.create(cattleRepo);
      transCattleRepo.findOneWithBasicRelations = jest.fn().mockResolvedValue(mockCattle);
      jest.spyOn(Object, 'create').mockImplementation(() => transCattleRepo);

      jest.spyOn(CattleMapper, 'toResponse').mockReturnValue({ id: 'new-cattle' } as any);

      await service.create(dto, makeSuperAdmin() as any);

      expect(cattleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ id: expect.any(String) }),
      );

      jest.restoreAllMocks();
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si bovin absent', async () => {
      cattleRepo.findOneForUpdate.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any, makeSuperAdmin() as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour les champs du bovin', async () => {
      const mockCattle = makeCattle();
      cattleRepo.findOneForUpdate.mockResolvedValue(mockCattle);

      const mockEm = makeEntityManagerMock();
      dataSource.transaction = jest.fn((cb: any) => cb(mockEm));

      const transCattleRepo = Object.create(cattleRepo);
      transCattleRepo.findOneWithRelations = jest.fn().mockResolvedValue(mockCattle);
      jest.spyOn(Object, 'create').mockImplementation(() => transCattleRepo);

      jest.spyOn(CattleMapper, 'toResponse').mockReturnValue({ id: 'cattle-1' } as any);

      const dto = {
        name: 'Nouveau nom',
        gender: Gender.F,
      } as any;

      const result = await service.update('cattle-1', dto, makeSuperAdmin() as any);

      expect(mockEm.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'cattle-1' });

      jest.restoreAllMocks();
    });

    it('met à jour les informations source si fournies', async () => {
      const mockCattle = makeCattle();
      cattleRepo.findOneForUpdate.mockResolvedValue(mockCattle);

      const mockEm = makeEntityManagerMock();
      dataSource.transaction = jest.fn((cb: any) => cb(mockEm));

      const transCattleRepo = Object.create(cattleRepo);
      transCattleRepo.findOneWithRelations = jest.fn().mockResolvedValue(mockCattle);
      jest.spyOn(Object, 'create').mockImplementation(() => transCattleRepo);

      jest.spyOn(CattleMapper, 'toResponse').mockReturnValue({ id: 'cattle-1' } as any);

      const dto = {
        source: {
          type: 'NE_DANS_TROUPEAU',
          supplier: 'Nouveau fournisseur',
        },
      } as any;

      await service.update('cattle-1', dto, makeSuperAdmin() as any);

      expect(mockCattle.sourceType).toBe(SourceType.NE_DANS_TROUPEAU);
      expect(mockCattle.sourceSupplier).toBe('Nouveau fournisseur');

      jest.restoreAllMocks();
    });
  });

  // ── getStatistics ────────────────────────────

  describe('getStatistics()', () => {
    it('retourne total, males, females', async () => {
      cattleRepo.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(4)  // males
        .mockResolvedValueOnce(6); // females

      const result = await service.getStatistics('owner-1', makeSuperAdmin() as any);

      expect(result).toMatchObject({ total: 10, males: 4, females: 6 });
    });
  });

  // ── registerBirth ────────────────────────────

  describe('registerBirth()', () => {
    it('BadRequestException si la mère est un mâle', async () => {
      const maleCattle = makeCattle({ gender: Gender.M });
      cattleRepo.findOne.mockResolvedValue(maleCattle);

      const dto = {
        name: 'Veau',
        gender: Gender.M,
        birthDate: new Date('2024-01-01'),
      } as any;

      await expect(service.registerBirth('cattle-1', dto, makeSuperAdmin() as any))
        .rejects.toThrow(BadRequestException);
    });

    it('BadRequestException si la mère est introuvable', async () => {
      cattleRepo.findOne.mockResolvedValue(null);

      await expect(
        service.registerBirth('cattle-1', { name: 'Veau' } as any, makeSuperAdmin() as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('crée un veau avec sourceMotherId correct', async () => {
      const mother = makeCattle({ gender: Gender.F, name: 'Mère' });
      cattleRepo.findOne.mockResolvedValue(mother);
      herdBookCattleRepo.findOne.mockResolvedValue(null); // pas d'entrée mère
      cattleRepo.findOneWithRelations.mockResolvedValue(makeCattle({ sourceType: SourceType.NE_DANS_TROUPEAU }));
      jest.spyOn(CattleMapper, 'toResponse').mockReturnValue({ id: 'new-calf' } as any);

      // Ré-implémenter dataSource.transaction pour capturer les appels em
      const savedEntities: any[] = [];
      const mockEm = {
        ...makeEntityManagerMock(),
        save: jest.fn((entity: any) => { savedEntities.push(entity); return Promise.resolve(entity); }),
        findOne: jest.fn().mockResolvedValue(null), // pas de type événement Naissance
      };
      dataSource.transaction = jest.fn((cb: any) => cb(mockEm));

      // Patch: cattleRepo doit retourner le veau après sauvegarde
      const transCattleRepo = Object.create(cattleRepo);
      transCattleRepo.findOneWithRelations = jest.fn().mockResolvedValue(makeCattle());
      jest.spyOn(Object, 'create').mockImplementation(() => transCattleRepo);

      cattleRepo.create.mockReturnValue({ id: 'new-calf', sourceMotherId: 'cattle-1' } as any);

      const dto = {
        name: 'Veau',
        gender: Gender.F,
        birthDate: new Date('2024-01-01'),
      } as any;

      await service.registerBirth('cattle-1', dto, makeSuperAdmin() as any);

      expect(cattleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ sourceMotherId: 'cattle-1', sourceType: SourceType.NE_DANS_TROUPEAU }),
      );

      jest.restoreAllMocks();
    });
  });

  // ── mapSourceType (méthode privée) ───────────

  describe('mapSourceType() [private]', () => {
    const callPrivate = (input: string) => (service as any).mapSourceType(input);

    it('retourne NE_DANS_TROUPEAU pour "NE_DANS_TROUPEAU"', () => {
      expect(callPrivate('NE_DANS_TROUPEAU')).toBe(SourceType.NE_DANS_TROUPEAU);
    });

    it('retourne NE_DANS_TROUPEAU pour "BORN_ON_FARM" (alias)', () => {
      expect(callPrivate('BORN_ON_FARM')).toBe(SourceType.NE_DANS_TROUPEAU);
    });

    it('retourne ACHETE pour toute autre valeur', () => {
      expect(callPrivate('ACHETE')).toBe(SourceType.ACHETE);
      expect(callPrivate('UNKNOWN')).toBe(SourceType.ACHETE);
      expect(callPrivate(undefined)).toBe(SourceType.ACHETE);
    });
  });
});
