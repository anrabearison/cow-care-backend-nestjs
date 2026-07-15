import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { CharactersService } from './characters.service';
import { CharactersRepository } from './characters.repository';
import { CharactersMapper } from './characters.mapper';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeCharacter = (overrides: any = {}) => ({
  id: 'chr-1',
  code: 'CHR001',
  name: 'Test Character',
  description: 'Test description',
  ...overrides,
});

const makeCharactersRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('CharactersService', () => {
  let service: CharactersService;
  let charactersRepo: ReturnType<typeof makeCharactersRepoMock>;

  beforeEach(async () => {
    charactersRepo = makeCharactersRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: CharactersRepository, useValue: charactersRepo },
      ],
    }).compile();

    service = module.get(CharactersService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('retourne les données mappées', async () => {
      const character = makeCharacter();
      charactersRepo.findAllWithRelations.mockResolvedValue({ data: [character], total: 1, page: 1, limit: 20 });
      jest.spyOn(CharactersMapper, 'toResponseList').mockReturnValue([{ id: 'chr-1' }] as any);

      const result = await service.findAll({});

      expect(result.data).toEqual([{ id: 'chr-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le caractère mappé', async () => {
      const character = makeCharacter();
      charactersRepo.findOne.mockResolvedValue(character);
      jest.spyOn(CharactersMapper, 'toResponse').mockReturnValue({ id: 'chr-1' } as any);

      const result = await service.findOne('chr-1');

      expect(result).toEqual({ id: 'chr-1' });
    });

    it('NotFoundException si absent', async () => {
      charactersRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un caractère et le retourne mappé', async () => {
      const dto = {
        code: 'CHR002',
        name: 'New Character',
        description: 'New description',
      } as any;

      const savedCharacter = makeCharacter({ code: 'CHR002' });
      charactersRepo.create.mockReturnValue(savedCharacter);
      charactersRepo.save.mockResolvedValue(savedCharacter);
      charactersRepo.findOne.mockResolvedValue(savedCharacter);
      jest.spyOn(CharactersMapper, 'toResponse').mockReturnValue({ id: 'chr-new' } as any);

      const result = await service.create(dto);

      expect(charactersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CHR002', name: 'New Character' }),
      );
      expect(charactersRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'chr-new' });
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      charactersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne le caractère', async () => {
      const character = makeCharacter();
      charactersRepo.findOne.mockResolvedValue(character);
      charactersRepo.save.mockResolvedValue(character);
      charactersRepo.findOne.mockResolvedValueOnce(character).mockResolvedValueOnce(character);
      jest.spyOn(CharactersMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { name: 'Updated Character', description: 'Updated description' } as any;

      await service.update('chr-1', dto);

      expect(character.name).toBe('Updated Character');
      expect(character.description).toBe('Updated description');
      expect(charactersRepo.save).toHaveBeenCalledWith(character);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime et retourne la réponse mappée', async () => {
      const character = makeCharacter();
      charactersRepo.findOne.mockResolvedValue(character);
      charactersRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(CharactersMapper, 'toResponse').mockReturnValue({ id: 'chr-1' } as any);

      const result = await service.remove('chr-1');

      expect(charactersRepo.remove).toHaveBeenCalledWith(character);
      expect(result).toEqual({ id: 'chr-1' });
    });

    it('NotFoundException si absent', async () => {
      charactersRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
