import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { CategoriesService } from './categories.service';
import { CategoriesRepository } from './categories.repository';
import { CategoriesMapper } from './categories.mapper';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeCategory = (overrides: any = {}) => ({
  id: 'cat-1',
  code: 'CAT001',
  name: 'Test Category',
  description: 'Test description',
  ...overrides,
});

const makeCategoriesRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepo: ReturnType<typeof makeCategoriesRepoMock>;

  beforeEach(async () => {
    categoriesRepo = makeCategoriesRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoriesRepository, useValue: categoriesRepo },
      ],
    }).compile();

    service = module.get(CategoriesService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('retourne les données mappées', async () => {
      const category = makeCategory();
      categoriesRepo.findAllWithRelations.mockResolvedValue({ data: [category], total: 1, page: 1, limit: 20 });
      jest.spyOn(CategoriesMapper, 'toResponseList').mockReturnValue([{ id: 'cat-1' }] as any);

      const result = await service.findAll({});

      expect(result.data).toEqual([{ id: 'cat-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne la catégorie mappée', async () => {
      const category = makeCategory();
      categoriesRepo.findOne.mockResolvedValue(category);
      jest.spyOn(CategoriesMapper, 'toResponse').mockReturnValue({ id: 'cat-1' } as any);

      const result = await service.findOne('cat-1');

      expect(result).toEqual({ id: 'cat-1' });
    });

    it('NotFoundException si absent', async () => {
      categoriesRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée une catégorie et la retourne mappée', async () => {
      const dto = {
        code: 'CAT002',
        name: 'New Category',
        description: 'New description',
      } as any;

      const savedCategory = makeCategory({ code: 'CAT002' });
      categoriesRepo.create.mockReturnValue(savedCategory);
      categoriesRepo.save.mockResolvedValue(savedCategory);
      categoriesRepo.findOne.mockResolvedValue(savedCategory);
      jest.spyOn(CategoriesMapper, 'toResponse').mockReturnValue({ id: 'cat-new' } as any);

      const result = await service.create(dto);

      expect(categoriesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CAT002', name: 'New Category' }),
      );
      expect(categoriesRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'cat-new' });
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      categoriesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne la catégorie', async () => {
      const category = makeCategory();
      categoriesRepo.findOne.mockResolvedValue(category);
      categoriesRepo.save.mockResolvedValue(category);
      categoriesRepo.findOne.mockResolvedValueOnce(category).mockResolvedValueOnce(category);
      jest.spyOn(CategoriesMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { name: 'Updated Category', description: 'Updated description' } as any;

      await service.update('cat-1', dto);

      expect(category.name).toBe('Updated Category');
      expect(category.description).toBe('Updated description');
      expect(categoriesRepo.save).toHaveBeenCalledWith(category);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime et retourne la réponse mappée', async () => {
      const category = makeCategory();
      categoriesRepo.findOne.mockResolvedValue(category);
      categoriesRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(CategoriesMapper, 'toResponse').mockReturnValue({ id: 'cat-1' } as any);

      const result = await service.remove('cat-1');

      expect(categoriesRepo.remove).toHaveBeenCalledWith(category);
      expect(result).toEqual({ id: 'cat-1' });
    });

    it('NotFoundException si absent', async () => {
      categoriesRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
