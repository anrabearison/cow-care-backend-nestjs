import { Test, TestingModule } from '@nestjs/testing';
import { CattleService } from './cattle.service';
import { CattleRepository } from './cattle.repository';
import { EventsService } from '../events/events.service';
import { TreatmentsService } from '../treatments/treatments.service';
import { CattleBirthService } from './cattle-birth.service';
import { DataSource, EntityManager } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { Event as EventEntity } from '../events/entities/event.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
import { EventType } from '../../platform/event-types/entities/event-type.entity';
import { CattlePhoto } from './entities/cattle-photo.entity';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeSuperAdmin = () => ({
  id: 'user-super',
  role: 'SUPER_ADMIN',
  ownerId: null,
});

const makeCattle = (overrides: any = {}) => ({
  id: 'cattle-1',
  name: 'Bella',
  gender: 'F',
  birthDate: new Date('2024-01-01'),
  ownerId: 'owner-1',
  events: [],
  treatments: [],
  photos: [],
  herdBookEntries: [],
  ...overrides,
});

describe('CattleService', () => {
    let service: CattleService;
    let cattleRepo: any;
    let dataSource: any;

    beforeEach(async () => {
        cattleRepo = {
            findOneWithBasicRelations: jest.fn(),
            findOneWithRelations: jest.fn(),
            findOneForUpdate: jest.fn(),
            create: jest.fn((data: any) => data),
            count: jest.fn(),
        };
        dataSource = { transaction: jest.fn() };
        
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CattleService,
                { provide: CattleRepository, useValue: cattleRepo },
                { provide: EventsService, useValue: {} },
                { provide: TreatmentsService, useValue: {} },
                { provide: CattleBirthService, useValue: {} },
                { provide: DataSource, useValue: dataSource },
                { provide: getRepositoryToken(HerdBookCattle), useValue: {} },
                { provide: getRepositoryToken(EventEntity), useValue: {} },
                { provide: getRepositoryToken(Treatment), useValue: {} },
                { provide: getRepositoryToken(EventType), useValue: {} },
                { provide: getRepositoryToken(CattlePhoto), useValue: {} },
            ],
        }).compile();

        service = module.get<CattleService>(CattleService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ── replacePhotos (private method test via update) ────────────────────────────

    describe('update() with photos', () => {
        it('removes all existing photos and creates new ones when photos array is provided', async () => {
            const mockCattle = makeCattle();
            cattleRepo.findOneForUpdate.mockResolvedValue(mockCattle);

            const deletedPhotos: any[] = [];
            const createdPhotos: any[] = [];
            
            const mockEm = {
                delete: jest.fn((entity: any, where: any) => {
                    deletedPhotos.push(where);
                    return Promise.resolve(undefined);
                }),
                create: jest.fn((entity: any, data: any) => {
                    createdPhotos.push(data);
                    return data;
                }),
                save: jest.fn().mockResolvedValue(undefined),
                find: jest.fn().mockResolvedValue([]),
                update: jest.fn().mockResolvedValue(undefined),
                findOne: jest.fn().mockResolvedValue(mockCattle),
            };
            dataSource.transaction = jest.fn((cb: any) => cb(mockEm));

            const dto = {
                photos: [
                    { url: 'http://example.com/photo1.jpg', publicId: 'pub1', position: 0, isPrimary: true },
                    { url: 'http://example.com/photo2.jpg', publicId: 'pub2', position: 1, isPrimary: false },
                ],
            } as any;

            await service.update('cattle-1', dto, makeSuperAdmin() as any);

            expect(mockEm.delete).toHaveBeenCalledWith(CattlePhoto, { cattleId: 'cattle-1' });
            expect(createdPhotos).toHaveLength(2);
            expect(createdPhotos[0]).toMatchObject({
                cattleId: 'cattle-1',
                url: 'http://example.com/photo1.jpg',
                publicId: 'pub1',
                position: 0,
                isPrimary: true,
            });
            expect(createdPhotos[1]).toMatchObject({
                cattleId: 'cattle-1',
                url: 'http://example.com/photo2.jpg',
                publicId: 'pub2',
                position: 1,
                isPrimary: false,
            });
        });

        it('clears photos when empty array is provided', async () => {
            const mockCattle = makeCattle();
            cattleRepo.findOneForUpdate.mockResolvedValue(mockCattle);

            const mockEm = {
                delete: jest.fn().mockResolvedValue(undefined),
                create: jest.fn(),
                save: jest.fn().mockResolvedValue(undefined),
                find: jest.fn().mockResolvedValue([]),
                update: jest.fn().mockResolvedValue(undefined),
                findOne: jest.fn().mockResolvedValue(mockCattle),
            };
            dataSource.transaction = jest.fn((cb: any) => cb(mockEm));

            const dto = { photos: [] } as any;

            await service.update('cattle-1', dto, makeSuperAdmin() as any);

            expect(mockEm.delete).toHaveBeenCalledWith(CattlePhoto, { cattleId: 'cattle-1' });
            expect(mockEm.create).not.toHaveBeenCalled();
        });

        it('does not modify photos when photos array is not provided', async () => {
            const mockCattle = makeCattle();
            cattleRepo.findOneForUpdate.mockResolvedValue(mockCattle);

            const mockEm = {
                delete: jest.fn().mockResolvedValue(undefined),
                create: jest.fn(),
                save: jest.fn().mockResolvedValue(undefined),
                find: jest.fn().mockResolvedValue([]),
                update: jest.fn().mockResolvedValue(undefined),
                findOne: jest.fn().mockResolvedValue(mockCattle),
            };
            dataSource.transaction = jest.fn((cb: any) => cb(mockEm));

            const dto = { name: 'Updated name' } as any;

            await service.update('cattle-1', dto, makeSuperAdmin() as any);

            expect(mockEm.delete).not.toHaveBeenCalled();
            expect(mockEm.create).not.toHaveBeenCalled();
        });

        it('synchronizes photos array before parent save to prevent cascade nullification', async () => {
            const mockCattle = makeCattle();
            cattleRepo.findOneForUpdate.mockResolvedValue(mockCattle);

            const syncedPhotos: any[] = [];
            const mockEm = {
                delete: jest.fn().mockResolvedValue(undefined),
                create: jest.fn(),
                save: jest.fn().mockResolvedValue(undefined),
                find: jest.fn((entity: any, where: any) => {
                    syncedPhotos.push({ entity, where });
                    return Promise.resolve([
                        { id: 'photo-1', cattleId: 'cattle-1', url: 'http://example.com/photo1.jpg' },
                    ]);
                }),
                update: jest.fn().mockResolvedValue(undefined),
                findOne: jest.fn().mockResolvedValue(mockCattle),
            };
            dataSource.transaction = jest.fn((cb: any) => cb(mockEm));

            const dto = {
                photos: [
                    { url: 'http://example.com/photo1.jpg', publicId: 'pub1', position: 0, isPrimary: true },
                ],
            } as any;

            await service.update('cattle-1', dto, makeSuperAdmin() as any);

            // Verify that photos are synchronized after replacePhotos but before final save
            expect(mockEm.find).toHaveBeenCalledWith(CattlePhoto, { where: { cattleId: 'cattle-1' } });
        });
    });

    // We keep basic tests for now, as business logic relies heavily on DB transactions
});
