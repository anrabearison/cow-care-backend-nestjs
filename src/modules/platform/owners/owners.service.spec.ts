import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { OwnersService } from './owners.service';
import { OwnersRepository } from './owners.repository';
import { OwnersMapper } from './owners.mapper';
import { User, UserRole } from '../users/entities/user.entity';

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

const makeUser = (overrides: any = {}) => ({
  id: 'user-1',
  email: 'user@example.com',
  role: UserRole.OWNER_USER,
  ownerId: 'own-1',
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
    it('retourne les données mappées pour SUPER_ADMIN', async () => {
      const owner = makeOwner();
      ownersRepo.findAllWithRelations.mockResolvedValue({ data: [owner], total: 1, page: 1, limit: 20 });
      jest.spyOn(OwnersMapper, 'toResponseList').mockReturnValue([{ id: 'own-1' }] as any);

      const superAdmin = makeUser({ role: UserRole.SUPER_ADMIN, ownerId: null });
      const result = await service.findAll({}, superAdmin);

      expect(result.data).toEqual([{ id: 'own-1' }]);
      expect(ownersRepo.findAllWithRelations).toHaveBeenCalledWith({ page: undefined, limit: undefined }, {});
    });

    it('filtre par ownerId pour OWNER_ADMIN', async () => {
      const owner = makeOwner();
      ownersRepo.findAllWithRelations.mockResolvedValue({ data: [owner], total: 1, page: 1, limit: 20 });
      jest.spyOn(OwnersMapper, 'toResponseList').mockReturnValue([{ id: 'own-1' }] as any);

      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'own-1' });
      const result = await service.findAll({}, ownerAdmin);

      expect(result.data).toEqual([{ id: 'own-1' }]);
      expect(ownersRepo.findAllWithRelations).toHaveBeenCalledWith({ page: undefined, limit: undefined, id: 'own-1' }, {});
    });

    it('filtre par ownerId pour OWNER_USER', async () => {
      const owner = makeOwner();
      ownersRepo.findAllWithRelations.mockResolvedValue({ data: [owner], total: 1, page: 1, limit: 20 });
      jest.spyOn(OwnersMapper, 'toResponseList').mockReturnValue([{ id: 'own-1' }] as any);

      const ownerUser = makeUser({ role: UserRole.OWNER_USER, ownerId: 'own-1' });
      const result = await service.findAll({}, ownerUser);

      expect(result.data).toEqual([{ id: 'own-1' }]);
      expect(ownersRepo.findAllWithRelations).toHaveBeenCalledWith({ page: undefined, limit: undefined, id: 'own-1' }, {});
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le propriétaire mappé pour SUPER_ADMIN', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);
      jest.spyOn(OwnersMapper, 'toResponse').mockReturnValue({ id: 'own-1' } as any);

      const superAdmin = makeUser({ role: UserRole.SUPER_ADMIN, ownerId: null });
      const result = await service.findOne('own-1', superAdmin);

      expect(result).toEqual({ id: 'own-1' });
    });

    it('retourne le propriétaire mappé pour OWNER_ADMIN avec même ownerId', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);
      jest.spyOn(OwnersMapper, 'toResponse').mockReturnValue({ id: 'own-1' } as any);

      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'own-1' });
      const result = await service.findOne('own-1', ownerAdmin);

      expect(result).toEqual({ id: 'own-1' });
    });

    it('ForbiddenException pour OWNER_ADMIN avec ownerId différent', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);

      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'own-2' });

      await expect(service.findOne('own-1', ownerAdmin))
        .rejects.toThrow(ForbiddenException);
    });

    it('ForbiddenException pour OWNER_USER avec ownerId différent', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);

      const ownerUser = makeUser({ role: UserRole.OWNER_USER, ownerId: 'own-2' });

      await expect(service.findOne('own-1', ownerUser))
        .rejects.toThrow(ForbiddenException);
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

    it('met à jour et retourne le propriétaire pour SUPER_ADMIN', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);
      ownersRepo.save.mockResolvedValue(owner);
      ownersRepo.findOne.mockResolvedValueOnce(owner).mockResolvedValueOnce(owner);
      jest.spyOn(OwnersMapper, 'toResponse').mockReturnValue({} as any);

      const superAdmin = makeUser({ role: UserRole.SUPER_ADMIN, ownerId: null });
      const dto = { name: 'Updated Owner', phone: '555555555' } as any;

      await service.update('own-1', dto, superAdmin);

      expect(owner.name).toBe('Updated Owner');
      expect(owner.phone).toBe('555555555');
      expect(ownersRepo.save).toHaveBeenCalledWith(owner);
    });

    it('met à jour et retourne le propriétaire pour OWNER_ADMIN avec même ownerId', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);
      ownersRepo.save.mockResolvedValue(owner);
      ownersRepo.findOne.mockResolvedValueOnce(owner).mockResolvedValueOnce(owner);
      jest.spyOn(OwnersMapper, 'toResponse').mockReturnValue({} as any);

      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'own-1' });
      const dto = { name: 'Updated Owner', phone: '555555555' } as any;

      await service.update('own-1', dto, ownerAdmin);

      expect(owner.name).toBe('Updated Owner');
      expect(owner.phone).toBe('555555555');
      expect(ownersRepo.save).toHaveBeenCalledWith(owner);
    });

    it('ForbiddenException pour OWNER_ADMIN avec ownerId différent', async () => {
      const owner = makeOwner();
      ownersRepo.findOne.mockResolvedValue(owner);

      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'own-2' });
      const dto = { name: 'Updated Owner' } as any;

      await expect(service.update('own-1', dto, ownerAdmin))
        .rejects.toThrow(ForbiddenException);
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
