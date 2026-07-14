import { Test, TestingModule } from '@nestjs/testing';
import { TreatmentsService } from './treatments.service';
import { TreatmentsRepository } from './treatments.repository';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User, UserRole } from '../users/entities/user.entity';

describe('TreatmentsService', () => {
    let service: TreatmentsService;
    let repository: jest.Mocked<TreatmentsRepository>;

    beforeEach(async () => {
        const mockRepository = {
            findAllWithRelations: jest.fn(),
            findOneWithRelations: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TreatmentsService,
                { provide: TreatmentsRepository, useValue: mockRepository },
            ],
        }).compile();

        service = module.get<TreatmentsService>(TreatmentsService);
        repository = module.get(TreatmentsRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findOne', () => {
        it('should throw NotFoundException if treatment not found', async () => {
            repository.findOneWithRelations.mockResolvedValue(null);
            
            await expect(service.findOne('uuid', { role: UserRole.OWNER_USER, ownerId: 'owner-1', organizationId: 'org-1' } as User))
                .rejects.toThrow(NotFoundException);
        });

        it('should return mapped treatment if found', async () => {
            const treatment = { id: 'uuid', type: 'Vaccin', dosageQuantity: 10, dosageUnit: 'ml' } as any;
            repository.findOneWithRelations.mockResolvedValue(treatment);
            
            const result = await service.findOne('uuid', { role: UserRole.OWNER_USER, ownerId: 'owner-1', organizationId: 'org-1' } as User);
            expect(result.id).toEqual(treatment.id);
            expect(result.dosage).toBeDefined();
            expect(result.dosage.quantity).toEqual(10);
        });
    });

    describe('findAll', () => {
        it('should throw ForbiddenException if user has no organizationId', async () => {
            const user = { role: UserRole.OWNER_USER, ownerId: 'owner-1', organizationId: null } as User;
            
            await expect(service.findAll({}, user)).rejects.toThrow(ForbiddenException);
        });

        it('should work if user has organizationId', async () => {
            const user = { role: UserRole.OWNER_USER, ownerId: 'owner-1', organizationId: 'org-1' } as User;
            repository.findAllWithRelations.mockResolvedValue({ data: [], total: 0, page: 1, perPage: 20 } as any);
            
            const result = await service.findAll({}, user);
            expect(result).toBeDefined();
        });
    });
});
