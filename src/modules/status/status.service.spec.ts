import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { StatusService } from './status.service';
import { StatusRepository } from './status.repository';
import { StatusMapper } from './status.mapper';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeStatus = (overrides: any = {}) => ({
  id: 'sta-1',
  code: 'STA001',
  name: 'Test Status',
  description: 'Test description',
  ...overrides,
});

const makeStatusRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('StatusService', () => {
  let service: StatusService;
  let statusRepo: ReturnType<typeof makeStatusRepoMock>;

  beforeEach(async () => {
    statusRepo = makeStatusRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusService,
        { provide: StatusRepository, useValue: statusRepo },
      ],
    }).compile();

    service = module.get(StatusService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('retourne les données mappées', async () => {
      const status = makeStatus();
      statusRepo.findAllWithRelations.mockResolvedValue({ data: [status], total: 1, page: 1, limit: 20 });
      jest.spyOn(StatusMapper, 'toResponseList').mockReturnValue([{ id: 'sta-1' }] as any);

      const result = await service.findAll({});

      expect(result.data).toEqual([{ id: 'sta-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le statut mappé', async () => {
      const status = makeStatus();
      statusRepo.findOne.mockResolvedValue(status);
      jest.spyOn(StatusMapper, 'toResponse').mockReturnValue({ id: 'sta-1' } as any);

      const result = await service.findOne('sta-1');

      expect(result).toEqual({ id: 'sta-1' });
    });

    it('NotFoundException si absent', async () => {
      statusRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un statut et le retourne mappé', async () => {
      const dto = {
        code: 'STA002',
        name: 'New Status',
        description: 'New description',
      } as any;

      const savedStatus = makeStatus({ code: 'STA002' });
      statusRepo.create.mockReturnValue(savedStatus);
      statusRepo.save.mockResolvedValue(savedStatus);
      statusRepo.findOne.mockResolvedValue(savedStatus);
      jest.spyOn(StatusMapper, 'toResponse').mockReturnValue({ id: 'sta-new' } as any);

      const result = await service.create(dto);

      expect(statusRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'STA002', name: 'New Status' }),
      );
      expect(statusRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'sta-new' });
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      statusRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne le statut', async () => {
      const status = makeStatus();
      statusRepo.findOne.mockResolvedValue(status);
      statusRepo.save.mockResolvedValue(status);
      statusRepo.findOne.mockResolvedValueOnce(status).mockResolvedValueOnce(status);
      jest.spyOn(StatusMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { name: 'Updated Status', description: 'Updated description' } as any;

      await service.update('sta-1', dto);

      expect(status.name).toBe('Updated Status');
      expect(status.description).toBe('Updated description');
      expect(statusRepo.save).toHaveBeenCalledWith(status);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime et retourne la réponse mappée', async () => {
      const status = makeStatus();
      statusRepo.findOne.mockResolvedValue(status);
      statusRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(StatusMapper, 'toResponse').mockReturnValue({ id: 'sta-1' } as any);

      const result = await service.remove('sta-1');

      expect(statusRepo.remove).toHaveBeenCalledWith(status);
      expect(result).toEqual({ id: 'sta-1' });
    });

    it('NotFoundException si absent', async () => {
      statusRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
