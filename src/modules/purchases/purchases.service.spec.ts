import { Test, TestingModule } from '@nestjs/testing';
import { PurchasesService } from './purchases.service';
import { PurchasesRepository } from './purchases.repository';
import { NotFoundException } from '@nestjs/common';
import { User, UserRole } from '../users/entities/user.entity';

describe('PurchasesService', () => {
    let service: PurchasesService;
    let repository: jest.Mocked<PurchasesRepository>;

    beforeEach(async () => {
        const mockRepository = {
            findAllPurchases: jest.fn(),
            findOnePurchase: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
            getDataSource: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PurchasesService,
                { provide: PurchasesRepository, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<PurchasesService>(PurchasesService);
        repository = module.get(PurchasesRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findOnePurchase', () => {
        it('should throw NotFoundException if purchase not found', async () => {
            repository.findOnePurchase.mockResolvedValue(null);
            
            await expect(service.findOnePurchase('uuid', { role: UserRole.OWNER_USER, ownerId: 'owner-1' } as User))
                .rejects.toThrow(NotFoundException);
        });

        it('should return purchase if found', async () => {
            const purchase = { id: 'uuid' } as any;
            repository.findOnePurchase.mockResolvedValue(purchase);
            
            const result = await service.findOnePurchase('uuid', { role: UserRole.OWNER_USER, ownerId: 'owner-1' } as User);
            expect(result).toEqual(purchase);
        });
    });

    describe('findAllPurchases', () => {
        it('should enforce RBAC for standard user', async () => {
            repository.findAllPurchases.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 10 } as any);
            const user = { role: UserRole.OWNER_USER, ownerId: 'owner-uuid' } as User;
            
            await service.findAllPurchases({}, user);
            
            expect(repository.findAllPurchases).toHaveBeenCalledWith(expect.objectContaining({
                ownerId: 'owner-uuid'
            }));
        });
        
        it('should allow SUPER_ADMIN to see all if no ownerId requested', async () => {
            repository.findAllPurchases.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 10 } as any);
            const user = { role: UserRole.SUPER_ADMIN } as User;
            
            await service.findAllPurchases({}, user);
            
            expect(repository.findAllPurchases).toHaveBeenCalledWith(expect.objectContaining({
                ownerId: null
            }));
        });
    });
});
