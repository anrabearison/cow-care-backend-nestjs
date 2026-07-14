import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VaccinesService } from './vaccines.service';
import { VaccinesRepository } from './vaccines.repository';
import { Vaccine } from './vaccines.entity';

describe('VaccinesService', () => {
  let service: VaccinesService;
  let repository: jest.Mocked<VaccinesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaccinesService,
        {
          provide: VaccinesRepository,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VaccinesService>(VaccinesService);
    repository = module.get(VaccinesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated vaccines', async () => {
      const expectedResult = {
        items: [{ id: '1', name: 'Rabies Vaccine', description: 'Prevents rabies', manufacturer: 'PharmaCorp', instructions: 'Administer 2ml', active: true, createdAt: new Date(), updatedAt: new Date() }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      repository.findAll.mockResolvedValue(expectedResult);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(expectedResult);
      expect(repository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should return a vaccine', async () => {
      const vaccine = { id: '1', name: 'Rabies Vaccine', description: 'Prevents rabies', manufacturer: 'PharmaCorp', instructions: 'Administer 2ml', active: true, createdAt: new Date(), updatedAt: new Date() };
      repository.findOne.mockResolvedValue(vaccine as Vaccine);

      const result = await service.findOne('1');

      expect(result).toEqual(vaccine);
      expect(repository.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if vaccine not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new vaccine', async () => {
      const createDto = { name: 'Rabies Vaccine', description: 'Prevents rabies' };
      const createdVaccine = { id: '1', ...createDto, manufacturer: null, instructions: null, active: true, createdAt: new Date(), updatedAt: new Date() };
      repository.create.mockResolvedValue(createdVaccine as Vaccine);

      const result = await service.create(createDto);

      expect(result).toEqual(createdVaccine);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a vaccine', async () => {
      const updateDto = { name: 'Updated Rabies Vaccine' };
      const updatedVaccine = { id: '1', name: 'Updated Rabies Vaccine', description: 'Prevents rabies', manufacturer: 'PharmaCorp', instructions: 'Administer 2ml', active: true, createdAt: new Date(), updatedAt: new Date() };
      repository.findOne.mockResolvedValue({ id: '1', name: 'Rabies Vaccine', description: 'Prevents rabies', manufacturer: 'PharmaCorp', instructions: 'Administer 2ml', active: true, createdAt: new Date(), updatedAt: new Date() } as Vaccine);
      repository.update.mockResolvedValue(updatedVaccine as Vaccine);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedVaccine);
      expect(repository.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should throw NotFoundException if vaccine not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('1', { name: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a vaccine', async () => {
      repository.findOne.mockResolvedValue({ id: '1', name: 'Rabies Vaccine', description: 'Prevents rabies', manufacturer: 'PharmaCorp', instructions: 'Administer 2ml', active: true, createdAt: new Date(), updatedAt: new Date() } as Vaccine);
      repository.remove.mockResolvedValue(undefined);

      await service.remove('1');

      expect(repository.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if vaccine not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
