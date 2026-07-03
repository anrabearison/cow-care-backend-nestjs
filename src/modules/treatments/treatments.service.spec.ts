import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { TreatmentsService } from './treatments.service';
import { TreatmentsRepository } from './treatments.repository';
import { TreatmentsMapper } from './treatments.mapper';
import { Treatment, TreatmentType, AdministrationRoute } from './entities/treatment.entity';
import { UserRole } from '../users/entities/user.entity';

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

const makeTreatment = (overrides: any = {}) => ({
  id: 'treatment-1',
  cattleId: 'cattle-1',
  type: TreatmentType.VACCIN,
  date: new Date('2024-06-01'),
  medicamentId: 'MED001',
  veterinarianId: 'VET001',
  notes: 'Test treatment',
  administrationRoute: AdministrationRoute.IM,
  dosageQuantity: 10,
  dosageUnit: 'ml',
  animalWeight: 500,
  dosageNotes: null,
  ...overrides,
});

const makeTreatmentsRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOneWithRelations: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('TreatmentsService', () => {
  let service: TreatmentsService;
  let treatmentsRepo: ReturnType<typeof makeTreatmentsRepoMock>;

  beforeEach(async () => {
    treatmentsRepo = makeTreatmentsRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreatmentsService,
        { provide: TreatmentsRepository, useValue: treatmentsRepo },
      ],
    }).compile();

    service = module.get(TreatmentsService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('SUPER_ADMIN : passe ownerId null', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      treatmentsRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({} as any, makeSuperAdmin() as any);

      expect(treatmentsRepo.findAllWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: null }),
        expect.any(Object),
      );
    });

    it('OWNER_USER : force ownerId', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      treatmentsRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({} as any, makeOwnerUser() as any);

      expect(treatmentsRepo.findAllWithRelations).toHaveBeenCalledWith(
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
      const treatment = makeTreatment();
      treatmentsRepo.findAllWithRelations.mockResolvedValue({ data: [treatment], total: 1, page: 1, limit: 20 });
      jest.spyOn(TreatmentsMapper, 'toResponseList').mockReturnValue([{ id: 'treatment-1' }] as any);

      const result = await service.findAll({} as any, makeSuperAdmin() as any);

      expect(result.data).toEqual([{ id: 'treatment-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le traitement mappé', async () => {
      const treatment = makeTreatment();
      treatmentsRepo.findOneWithRelations.mockResolvedValue(treatment);
      jest.spyOn(TreatmentsMapper, 'toResponse').mockReturnValue({ id: 'treatment-1' } as any);

      const result = await service.findOne('treatment-1', makeSuperAdmin() as any);

      expect(result).toEqual({ id: 'treatment-1' });
    });

    it('NotFoundException si absent', async () => {
      treatmentsRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(service.findOne('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un traitement avec mapping des champs dosage', async () => {
      const dto = {
        cattleId: 'cattle-1',
        type: TreatmentType.VACCIN,
        date: new Date('2024-06-01'),
        product: 'MED001',
        veterinarian: 'VET001',
        administrationRoute: AdministrationRoute.IM,
        dosage: {
          quantity: 5,
          unit: 'ml',
          animalWeight: 250,
          notes: 'Test dosage',
        },
      } as any;

      const savedTreatment = makeTreatment();
      treatmentsRepo.create.mockReturnValue(savedTreatment);
      treatmentsRepo.save.mockResolvedValue(savedTreatment);
      treatmentsRepo.findOneWithRelations.mockResolvedValue(savedTreatment);
      jest.spyOn(TreatmentsMapper, 'toResponse').mockReturnValue({ id: 'treatment-1' } as any);

      const result = await service.create(dto, makeSuperAdmin() as any);

      expect(treatmentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cattleId: 'cattle-1',
          type: TreatmentType.VACCIN,
          medicamentId: 'MED001',
          veterinarianId: 'VET001',
          administrationRoute: AdministrationRoute.IM,
          dosageQuantity: 5,
          dosageUnit: 'ml',
          animalWeight: 250,
          dosageNotes: 'Test dosage',
        }),
      );
      expect(treatmentsRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'treatment-1' });
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si traitement absent', async () => {
      treatmentsRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any, makeSuperAdmin() as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour les champs y compris dosage', async () => {
      const treatment = makeTreatment();
      treatmentsRepo.findOneWithRelations.mockResolvedValue(treatment);
      treatmentsRepo.save.mockResolvedValue(treatment);
      treatmentsRepo.findOneWithRelations.mockResolvedValueOnce(treatment).mockResolvedValueOnce(treatment);
      jest.spyOn(TreatmentsMapper, 'toResponse').mockReturnValue({} as any);

      const dto = {
        type: TreatmentType.ANTIBIOTIQUE,
        product: 'MED002',
        dosage: { quantity: 15, unit: 'mg' },
      } as any;

      await service.update('treatment-1', dto, makeSuperAdmin() as any);

      expect(treatment.type).toBe(TreatmentType.ANTIBIOTIQUE);
      expect(treatment.medicamentId).toBe('MED002');
      expect(treatment.dosageQuantity).toBe(15);
      expect(treatment.dosageUnit).toBe('mg');
      expect(treatmentsRepo.save).toHaveBeenCalledWith(treatment);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime le traitement et retourne la réponse mappée', async () => {
      const treatment = makeTreatment();
      treatmentsRepo.findOneWithRelations.mockResolvedValue(treatment);
      treatmentsRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(TreatmentsMapper, 'toResponse').mockReturnValue({ id: 'treatment-1' } as any);

      const result = await service.remove('treatment-1', makeSuperAdmin() as any);

      expect(treatmentsRepo.remove).toHaveBeenCalledWith(treatment);
      expect(result).toEqual({ id: 'treatment-1' });
    });

    it('NotFoundException si traitement absent', async () => {
      treatmentsRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(service.remove('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── updateCattleTreatments ───────────────────

  describe('updateCattleTreatments()', () => {
    it('ne fait rien si incomingTreatments est null/undefined', async () => {
      const em = { remove: jest.fn(), update: jest.fn(), create: jest.fn(), save: jest.fn() };

      await service.updateCattleTreatments(em, 'cattle-1', [], null as any);

      expect(em.remove).not.toHaveBeenCalled();
      expect(em.save).not.toHaveBeenCalled();
    });

    it('supprime les traitements non inclus dans incomingTreatments', async () => {
      const existing = [makeTreatment({ id: 'trt-to-delete' })];
      const incoming = []; // aucun traitement conservé
      const em = { remove: jest.fn().mockResolvedValue(undefined) };

      await service.updateCattleTreatments(em as any, 'cattle-1', existing, incoming);

      expect(em.remove).toHaveBeenCalledWith(existing);
    });

    it('update les traitements existants (avec id)', async () => {
      const existing = [makeTreatment({ id: 'trt-1' })];
      const incoming = [{
        id: 'trt-1',
        type: TreatmentType.ANTIBIOTIQUE,
        product: 'MED002',
        dosage: { quantity: 20 },
      }];
      const em = {
        remove: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        create: jest.fn(),
        save: jest.fn(),
      };

      await service.updateCattleTreatments(em as any, 'cattle-1', existing, incoming);

      expect(em.update).toHaveBeenCalledWith(
        Treatment,
        'trt-1',
        expect.objectContaining({
          type: TreatmentType.ANTIBIOTIQUE,
          medicamentId: 'MED002',
          dosageQuantity: 20,
        }),
      );
      expect(em.save).not.toHaveBeenCalled();
    });

    it('crée les nouveaux traitements (sans id)', async () => {
      const incoming = [{
        type: TreatmentType.VACCIN,
        date: new Date(),
        product: 'MED001',
      }];
      const em = {
        remove: jest.fn(),
        update: jest.fn(),
        create: jest.fn().mockReturnValue({ cattleId: 'cattle-1' }),
        save: jest.fn().mockResolvedValue(undefined),
      };

      await service.updateCattleTreatments(em as any, 'cattle-1', [], incoming);

      expect(em.create).toHaveBeenCalledWith(
        Treatment,
        expect.objectContaining({
          cattleId: 'cattle-1',
          type: TreatmentType.VACCIN,
          medicamentId: 'MED001',
        }),
      );
      expect(em.save).toHaveBeenCalled();
    });
  });
});
