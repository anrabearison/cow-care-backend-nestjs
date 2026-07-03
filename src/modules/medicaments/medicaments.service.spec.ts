import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { MedicamentsService } from './medicaments.service';
import { MedicamentsRepository } from './medicaments.repository';
import { MedicamentsMapper } from './medicaments.mapper';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeMedicament = (overrides: any = {}) => ({
  id: 'med-1',
  code: 'MED001',
  name: 'Test Medicament',
  description: 'Test description',
  ...overrides,
});

const makeMedicamentsRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('MedicamentsService', () => {
  let service: MedicamentsService;
  let medicamentsRepo: ReturnType<typeof makeMedicamentsRepoMock>;

  beforeEach(async () => {
    medicamentsRepo = makeMedicamentsRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicamentsService,
        { provide: MedicamentsRepository, useValue: medicamentsRepo },
      ],
    }).compile();

    service = module.get(MedicamentsService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('retourne les données mappées', async () => {
      const medicament = makeMedicament();
      medicamentsRepo.findAllWithRelations.mockResolvedValue({ data: [medicament], total: 1, page: 1, limit: 20 });
      jest.spyOn(MedicamentsMapper, 'toResponseList').mockReturnValue([{ id: 'med-1' }] as any);

      const result = await service.findAll({});

      expect(result.data).toEqual([{ id: 'med-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le médicament mappé', async () => {
      const medicament = makeMedicament();
      medicamentsRepo.findOne.mockResolvedValue(medicament);
      jest.spyOn(MedicamentsMapper, 'toResponse').mockReturnValue({ id: 'med-1' } as any);

      const result = await service.findOne('med-1');

      expect(result).toEqual({ id: 'med-1' });
    });

    it('NotFoundException si absent', async () => {
      medicamentsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un médicament et le retourne mappé', async () => {
      const dto = {
        code: 'MED002',
        name: 'New Medicament',
        description: 'New description',
      } as any;

      const savedMedicament = makeMedicament({ code: 'MED002' });
      medicamentsRepo.create.mockReturnValue(savedMedicament);
      medicamentsRepo.save.mockResolvedValue(savedMedicament);
      medicamentsRepo.findOne.mockResolvedValue(savedMedicament);
      jest.spyOn(MedicamentsMapper, 'toResponse').mockReturnValue({ id: 'med-new' } as any);

      const result = await service.create(dto);

      expect(medicamentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'MED002', name: 'New Medicament' }),
      );
      expect(medicamentsRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'med-new' });
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      medicamentsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne le médicament', async () => {
      const medicament = makeMedicament();
      medicamentsRepo.findOne.mockResolvedValue(medicament);
      medicamentsRepo.save.mockResolvedValue(medicament);
      medicamentsRepo.findOne.mockResolvedValueOnce(medicament).mockResolvedValueOnce(medicament);
      jest.spyOn(MedicamentsMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { name: 'Updated Medicament', description: 'Updated description' } as any;

      await service.update('med-1', dto);

      expect(medicament.name).toBe('Updated Medicament');
      expect(medicament.description).toBe('Updated description');
      expect(medicamentsRepo.save).toHaveBeenCalledWith(medicament);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime et retourne la réponse mappée', async () => {
      const medicament = makeMedicament();
      medicamentsRepo.findOne.mockResolvedValue(medicament);
      medicamentsRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(MedicamentsMapper, 'toResponse').mockReturnValue({ id: 'med-1' } as any);

      const result = await service.remove('med-1');

      expect(medicamentsRepo.remove).toHaveBeenCalledWith(medicament);
      expect(result).toEqual({ id: 'med-1' });
    });

    it('NotFoundException si absent', async () => {
      medicamentsRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
