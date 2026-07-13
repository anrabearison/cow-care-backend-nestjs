import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { EventsService } from './events.service';
import { EventsRepository } from './events.repository';
import { EventsMapper } from './events.mapper';
import { Event as EventEntity } from './entities/event.entity';
import { EntityManager } from 'typeorm';
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

const makeEvent = (overrides: any = {}) => ({
  id: 'event-1',
  cattleId: 'cattle-1',
  eventTypeId: 'EVT001',
  date: new Date('2024-06-01'),
  description: 'Test event',
  details: null,
  ...overrides,
});

const makeEventsRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOneWithRelations: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('EventsService', () => {
  let service: EventsService;
  let eventsRepo: ReturnType<typeof makeEventsRepoMock>;

  beforeEach(async () => {
    eventsRepo = makeEventsRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: EventsRepository, useValue: eventsRepo },
      ],
    }).compile();

    service = module.get(EventsService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('SUPER_ADMIN : passe ownerId null', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      eventsRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({} as any, makeSuperAdmin() as any);

      expect(eventsRepo.findAllWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: null }),
        expect.any(Object),
      );
    });

    it('OWNER_USER : force ownerId', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      eventsRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({} as any, makeOwnerUser() as any);

      expect(eventsRepo.findAllWithRelations).toHaveBeenCalledWith(
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
      const event = makeEvent();
      eventsRepo.findAllWithRelations.mockResolvedValue({ data: [event], total: 1, page: 1, limit: 20 });
      jest.spyOn(EventsMapper, 'toResponseList').mockReturnValue([{ id: 'event-1' }] as any);

      const result = await service.findAll({} as any, makeSuperAdmin() as any);

      expect(result.data).toEqual([{ id: 'event-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it("retourne l'événement mappé", async () => {
      const event = makeEvent();
      eventsRepo.findOneWithRelations.mockResolvedValue(event);
      jest.spyOn(EventsMapper, 'toResponse').mockReturnValue({ id: 'event-1' } as any);

      const result = await service.findOne('event-1', makeSuperAdmin() as any);

      expect(result).toEqual({ id: 'event-1' });
    });

    it('NotFoundException si absent', async () => {
      eventsRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(service.findOne('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée un événement et le retourne mappé', async () => {
      const dto = {
        cattleId: 'cattle-1',
        eventTypeId: 'EVT002',
        date: new Date('2024-06-01'),
        description: 'Vaccination',
      } as any;

      const savedEvent = makeEvent({ eventTypeId: 'EVT002' });
      eventsRepo.create.mockReturnValue(savedEvent);
      eventsRepo.save.mockResolvedValue(savedEvent);
      eventsRepo.findOneWithRelations.mockResolvedValue(savedEvent);
      jest.spyOn(EventsMapper, 'toResponse').mockReturnValue({ id: 'event-1' } as any);

      const result = await service.create(dto, makeSuperAdmin() as any);

      expect(eventsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ cattleId: 'cattle-1', eventTypeId: 'EVT002' }),
      );
      expect(eventsRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ id: 'event-1' });
    });

    it('préfère eventTypeId à type si les deux sont fournis', async () => {
      const dto = { cattleId: 'cattle-1', eventTypeId: 'EVT002', type: 'EVT_OLD' } as any;
      const savedEvent = makeEvent();
      eventsRepo.create.mockReturnValue(savedEvent);
      eventsRepo.save.mockResolvedValue(savedEvent);
      eventsRepo.findOneWithRelations.mockResolvedValue(savedEvent);
      jest.spyOn(EventsMapper, 'toResponse').mockReturnValue({} as any);

      await service.create(dto, makeSuperAdmin() as any);

      expect(eventsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ eventTypeId: 'EVT002' }),
      );
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si événement absent', async () => {
      eventsRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any, makeSuperAdmin() as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('traduit type → eventTypeId si type est fourni', async () => {
      const event = makeEvent();
      eventsRepo.findOneWithRelations.mockResolvedValue(event);
      eventsRepo.save.mockResolvedValue(event);
      eventsRepo.findOneWithRelations.mockResolvedValueOnce(event).mockResolvedValueOnce(event);
      jest.spyOn(EventsMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { type: 'EVT003', description: 'Mise à jour' } as any;
      await service.update('event-1', dto, makeSuperAdmin() as any);

      expect(dto.eventTypeId).toBe('EVT003');
      expect(dto.type).toBeUndefined();
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it("supprime l'événement et retourne la réponse mappée", async () => {
      const event = makeEvent();
      eventsRepo.findOneWithRelations.mockResolvedValue(event);
      eventsRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(EventsMapper, 'toResponse').mockReturnValue({ id: 'event-1' } as any);

      const result = await service.remove('event-1', makeSuperAdmin() as any);

      expect(eventsRepo.remove).toHaveBeenCalledWith(event);
      expect(result).toEqual({ id: 'event-1' });
    });

    it('NotFoundException si événement absent', async () => {
      eventsRepo.findOneWithRelations.mockResolvedValue(null);

      await expect(service.remove('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── updateCattleEvents ───────────────────────

  describe('updateCattleEvents()', () => {
    it('ne fait rien si incomingEvents est null/undefined', async () => {
      const em = { remove: jest.fn(), update: jest.fn(), create: jest.fn(), save: jest.fn() };

      await service.updateCattleEvents(em as any as EntityManager, 'cattle-1', [], null as any);

      expect(em.remove).not.toHaveBeenCalled();
      expect(em.save).not.toHaveBeenCalled();
    });

    it('supprime les events non inclus dans incomingEvents', async () => {
      const existing = [makeEvent({ id: 'ev-to-delete' })];
      const incoming = []; // aucun event conservé
      const em = { remove: jest.fn().mockResolvedValue(undefined) };

      await service.updateCattleEvents(em as any, 'cattle-1', existing, incoming);

      expect(em.remove).toHaveBeenCalledWith(existing);
    });

    it('update les events existants (avec id)', async () => {
      const existing = [makeEvent({ id: 'ev-1' })];
      const incoming = [{ id: 'ev-1', type: 'EVT003', date: new Date(), description: 'Updated' }];
      const em = {
        remove: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        create: jest.fn(),
        save: jest.fn(),
      };

      await service.updateCattleEvents(em as any, 'cattle-1', existing, incoming);

      expect(em.update).toHaveBeenCalledWith(
        EventEntity,
        'ev-1',
        expect.objectContaining({ eventTypeId: 'EVT003' }),
      );
      expect(em.save).not.toHaveBeenCalled();
    });

    it('crée les nouveaux events (sans id)', async () => {
      const incoming = [{ type: 'EVT002', date: new Date(), description: 'New event' }];
      const em = {
        remove: jest.fn(),
        update: jest.fn(),
        insert: jest.fn().mockResolvedValue(undefined),
      };

      await service.updateCattleEvents(em as any, 'cattle-1', [], incoming);

      expect(em.insert).toHaveBeenCalledWith(
        EventEntity,
        expect.objectContaining({ cattleId: 'cattle-1', eventTypeId: 'EVT002' }),
      );
    });
  });
});
