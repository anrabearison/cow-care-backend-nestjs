import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';

import { VeterinariansService } from './veterinarians.service';
import { VeterinariansRepository } from './veterinarians.repository';
import { VeterinariansMapper } from './veterinarians.mapper';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeVeterinarian = (overrides: any = {}) => ({
  id: 'vet-1',
  name: 'Test Veterinarian',
  email: 'vet@example.com',
  phone: '123456789',
  address: 'Test Address',
  licenseNumber: 'LIC001',
  ...overrides,
});

const makeVeterinariansRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('VeterinariansService', () => {
  let service: VeterinariansService;
  let veterinariansRepo: ReturnType<typeof makeVeterinariansRepoMock>;

  beforeEach(async () => {
    veterinariansRepo = makeVeterinariansRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VeterinariansService,
        { provide: VeterinariansRepository, useValue: veterinariansRepo },
      ],
    }).compile();

    service = module.get(VeterinariansService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('retourne les données mappées', async () => {
      const veterinarian = makeVeterinarian();
      veterinariansRepo.findAllWithRelations.mockResolvedValue({ data: [veterinarian], total: 1, page: 1, limit: 20 });
      jest.spyOn(VeterinariansMapper, 'toResponseList').mockReturnValue([{ id: 'vet-1' }] as any);

      const result = await service.findAll({});

      expect(result.data).toEqual([{ id: 'vet-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le vétérinaire mappé', async () => {
      const veterinarian = makeVeterinarian();
      veterinariansRepo.findOne.mockResolvedValue(veterinarian);
      jest.spyOn(VeterinariansMapper, 'toResponse').mockReturnValue({ id: 'vet-1' } as any);

      const result = await service.findOne('vet-1');

      expect(result).toEqual({ id: 'vet-1' });
    });

    it('NotFoundException si absent', async () => {
      veterinariansRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un vétérinaire et le retourne mappé', async () => {
      const dto = {
        name: 'New Veterinarian',
        email: 'newvet@example.com',
        phone: '987654321',
        address: 'New Address',
        licenseNumber: 'LIC002',
      } as any;

      const savedVeterinarian = makeVeterinarian({ name: 'New Veterinarian' });
      veterinariansRepo.create.mockReturnValue(savedVeterinarian);
      veterinariansRepo.save.mockResolvedValue(savedVeterinarian);
      veterinariansRepo.findOne.mockResolvedValue(savedVeterinarian);
      jest.spyOn(VeterinariansMapper, 'toResponse').mockReturnValue({ id: 'vet-new' } as any);

      const result = await service.create(dto);

      expect(veterinariansRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Veterinarian', email: 'newvet@example.com' }),
      );
      expect(veterinariansRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'vet-new' });
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      veterinariansRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne le vétérinaire', async () => {
      const veterinarian = makeVeterinarian();
      veterinariansRepo.findOne.mockResolvedValue(veterinarian);
      veterinariansRepo.save.mockResolvedValue(veterinarian);
      veterinariansRepo.findOne.mockResolvedValueOnce(veterinarian).mockResolvedValueOnce(veterinarian);
      jest.spyOn(VeterinariansMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { name: 'Updated Veterinarian', phone: '555555555' } as any;

      await service.update('vet-1', dto);

      expect(veterinarian.name).toBe('Updated Veterinarian');
      expect(veterinarian.phone).toBe('555555555');
      expect(veterinariansRepo.save).toHaveBeenCalledWith(veterinarian);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime et retourne la réponse mappée', async () => {
      const veterinarian = makeVeterinarian();
      veterinariansRepo.findOne.mockResolvedValue(veterinarian);
      veterinariansRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(VeterinariansMapper, 'toResponse').mockReturnValue({ id: 'vet-1' } as any);

      const result = await service.remove('vet-1');

      expect(veterinariansRepo.remove).toHaveBeenCalledWith(veterinarian);
      expect(result).toEqual({ id: 'vet-1' });
    });

    it('NotFoundException si absent', async () => {
      veterinariansRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
