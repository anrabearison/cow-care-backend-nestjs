import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { EventTypesService } from './event-types.service';
import { EventTypesRepository } from './event-types.repository';
import { EventTypesMapper } from './event-types.mapper';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeEventType = (overrides: any = {}) => ({
  id: 'evt-1',
  code: 'EVT001',
  name: 'Test Event Type',
  description: 'Test description',
  ...overrides,
});

const makeEventTypesRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('EventTypesService', () => {
  let service: EventTypesService;
  let eventTypesRepo: ReturnType<typeof makeEventTypesRepoMock>;

  beforeEach(async () => {
    eventTypesRepo = makeEventTypesRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventTypesService,
        { provide: EventTypesRepository, useValue: eventTypesRepo },
      ],
    }).compile();

    service = module.get(EventTypesService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('retourne les données mappées', async () => {
      const eventType = makeEventType();
      eventTypesRepo.findAllWithRelations.mockResolvedValue({ data: [eventType], total: 1, page: 1, limit: 20 });
      jest.spyOn(EventTypesMapper, 'toResponseList').mockReturnValue([{ id: 'evt-1' }] as any);

      const result = await service.findAll({});

      expect(result.data).toEqual([{ id: 'evt-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne le type d\'événement mappé', async () => {
      const eventType = makeEventType();
      eventTypesRepo.findOne.mockResolvedValue(eventType);
      jest.spyOn(EventTypesMapper, 'toResponse').mockReturnValue({ id: 'evt-1' } as any);

      const result = await service.findOne('evt-1');

      expect(result).toEqual({ id: 'evt-1' });
    });

    it('NotFoundException si absent', async () => {
      eventTypesRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un type d\'événement et le retourne mappé', async () => {
      const dto = {
        code: 'EVT002',
        name: 'New Event Type',
        description: 'New description',
      } as any;

      const savedEventType = makeEventType({ code: 'EVT002' });
      eventTypesRepo.create.mockReturnValue(savedEventType);
      eventTypesRepo.save.mockResolvedValue(savedEventType);
      eventTypesRepo.findOne.mockResolvedValue(savedEventType);
      jest.spyOn(EventTypesMapper, 'toResponse').mockReturnValue({ id: 'evt-new' } as any);

      const result = await service.create(dto);

      expect(eventTypesRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'EVT002', name: 'New Event Type' }),
      );
      expect(eventTypesRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'evt-new' });
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      eventTypesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne le type d\'événement', async () => {
      const eventType = makeEventType();
      eventTypesRepo.findOne.mockResolvedValue(eventType);
      eventTypesRepo.save.mockResolvedValue(eventType);
      eventTypesRepo.findOne.mockResolvedValueOnce(eventType).mockResolvedValueOnce(eventType);
      jest.spyOn(EventTypesMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { name: 'Updated Event Type', description: 'Updated description' } as any;

      await service.update('evt-1', dto);

      expect(eventType.name).toBe('Updated Event Type');
      expect(eventType.description).toBe('Updated description');
      expect(eventTypesRepo.save).toHaveBeenCalledWith(eventType);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('supprime et retourne la réponse mappée', async () => {
      const eventType = makeEventType();
      eventTypesRepo.findOne.mockResolvedValue(eventType);
      eventTypesRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(EventTypesMapper, 'toResponse').mockReturnValue({ id: 'evt-1' } as any);

      const result = await service.remove('evt-1');

      expect(eventTypesRepo.remove).toHaveBeenCalledWith(eventType);
      expect(result).toEqual({ id: 'evt-1' });
    });

    it('NotFoundException si absent', async () => {
      eventTypesRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
