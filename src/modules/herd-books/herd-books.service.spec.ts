import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { HerdBooksService } from './herd-books.service';
import { HerdBooksRepository } from './herd-books.repository';
import { HerdBooksMapper } from './herd-books.mapper';
import { UserRole } from '../users/entities/user.entity';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeSuperAdmin = () => ({
  id: 'user-super',
  role: UserRole.SUPER_ADMIN,
  ownerId: null,
  organizationId: null,
});

const makeOwnerUser = (overrides = {}) => ({
  id: 'user-owner',
  role: UserRole.OWNER_USER,
  ownerId: 'owner-1',
  organizationId: 'org-1',
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

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('HerdBooksService', () => {
  let service: HerdBooksService;
  let herdBooksRepo: ReturnType<typeof makeHerdBooksRepoMock>;

  beforeEach(async () => {
    herdBooksRepo = makeHerdBooksRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HerdBooksService,
        { provide: HerdBooksRepository, useValue: herdBooksRepo },
      ],
    }).compile();

    service = module.get(HerdBooksService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('SUPER_ADMIN sans organization → ForbiddenException', async () => {
      await expect(
        service.findAll({} as any, makeSuperAdmin() as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('OWNER_USER : force ownerId', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      herdBooksRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({} as any, makeOwnerUser() as any);

      expect(herdBooksRepo.findAllWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: 'owner-1', organizationId: 'org-1' }),
        expect.any(Object),
      );
    });

    it('OWNER_USER sans organizationId → ForbiddenException', async () => {
      await expect(
        service.findAll({} as any, makeOwnerUser({ organizationId: null }) as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('retourne les données mappées', async () => {
      const hb = makeHerdBook();
      herdBooksRepo.findAllWithRelations.mockResolvedValue({ data: [hb], total: 1, page: 1, limit: 20 });
      jest.spyOn(HerdBooksMapper, 'toResponseList').mockReturnValue([{ id: 'hb-1' }] as any);

      const result = await service.findAll({} as any, makeOwnerUser() as any);

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

      const result = await service.create(dto, makeOwnerUser() as any);

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
        service.update('unknown', {} as any, makeOwnerUser() as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne le livre', async () => {
      const hb = makeHerdBook();
      herdBooksRepo.findOneWithRelations.mockResolvedValue(hb);
      herdBooksRepo.save.mockResolvedValue(hb);
      herdBooksRepo.findOneWithRelations.mockResolvedValueOnce(hb).mockResolvedValueOnce(hb);
      jest.spyOn(HerdBooksMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { year: 2026, description: 'Updated' } as any;

      await service.update('hb-1', dto, makeOwnerUser() as any);

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
});
