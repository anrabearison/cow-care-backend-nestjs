import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { OwnersService } from './owners.service';
import { OwnersRepository } from './owners.repository';
import { OwnersMapper } from './owners.mapper';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeOwner = (overrides: any = {}) => ({
  id: 'own-1',
  name: 'Test Owner',
  email: 'test@example.com',
  phone: '123456789',
  address: 'Test Address',
  ...overrides,
});

const makeOwnersRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('OwnersService', () => {
  let service: OwnersService;
  let ownersRepo: ReturnType<typeof makeOwnersRepoMock>;

  beforeEach(async () => {
    ownersRepo = makeOwnersRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OwnersService,
        { provide: OwnersRepository, useValue: ownersRepo },
      ],
    }).compile();

    service = module.get(OwnersService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('retourne les données mappées', async () => {
      const owner = makeOwner();
      ownersRepo.findAllWithRelations.mockResolvedValue({ data: [owner], total: 1, page: 1, limit: 20 });
      jest.spyOn(OwnersMapper, 'toResponseList').mockReturnValue([{ id: 'own-1' }] as any);

      const result = await service.findAll({});

      expect(result.data).toEqual([{ id: 'own-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le propriétaire mappé', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);
      jest.spyOn(OwnersMapper, 'toResponse').mockReturnValue({ id: 'own-1' } as any);

      const result = await service.findOne('own-1');

      expect(result).toEqual({ id: 'own-1' });
    });

    it('NotFoundException si absent', async () => {
      ownersRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un propriétaire et le retourne mappé', async () => {
      const dto = {
        name: 'New Owner',
        email: 'new@example.com',
        phone: '987654321',
        address: 'New Address',
      } as any;

      const savedOwner = makeOwner({ name: 'New Owner' });
      ownersRepo.create.mockReturnValue(savedOwner);
      ownersRepo.save.mockResolvedValue(savedOwner);
      ownersRepo.findOne.mockResolvedValue(savedOwner);
      jest.spyOn(OwnersMapper, 'toResponse').mockReturnValue({ id: 'own-new' } as any);

      const result = await service.create(dto);

      expect(ownersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Owner', email: 'new@example.com' }),
      );
      expect(ownersRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'own-new' });
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      ownersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne le propriétaire', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);
      ownersRepo.save.mockResolvedValue(owner);
      ownersRepo.findOne.mockResolvedValueOnce(owner).mockResolvedValueOnce(owner);
      jest.spyOn(OwnersMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { name: 'Updated Owner', phone: '555555555' } as any;

      await service.update('own-1', dto);

      expect(owner.name).toBe('Updated Owner');
      expect(owner.phone).toBe('555555555');
      expect(ownersRepo.save).toHaveBeenCalledWith(owner);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime et retourne la réponse mappée', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);
      ownersRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(OwnersMapper, 'toResponse').mockReturnValue({ id: 'own-1' } as any);

      const result = await service.remove('own-1');

      expect(ownersRepo.remove).toHaveBeenCalledWith(owner);
      expect(result).toEqual({ id: 'own-1' });
    });

    it('NotFoundException si absent', async () => {
      ownersRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
