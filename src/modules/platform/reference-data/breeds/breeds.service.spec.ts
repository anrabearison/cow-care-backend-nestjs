import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { BreedsService } from './breeds.service';
import { BreedsRepository } from './breeds.repository';
import { Breed } from './breeds.entity';
import { Repository } from 'typeorm';

describe('BreedsService', () => {
  let service: BreedsService;
  let repository: jest.Mocked<BreedsRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BreedsService,
        {
          provide: BreedsRepository,
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

    service = module.get<BreedsService>(BreedsService);
    repository = module.get(BreedsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated breeds', async () => {
      const expectedResult = {
        items: [{ id: '1', name: 'Holstein', description: 'Dairy breed', active: true, createdAt: new Date(), updatedAt: new Date() }],
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
    it('should return a breed', async () => {
      const breed = { id: '1', name: 'Holstein', description: 'Dairy breed', active: true, createdAt: new Date(), updatedAt: new Date() };
      repository.findOne.mockResolvedValue(breed as Breed);

      const result = await service.findOne('1');

      expect(result).toEqual(breed);
      expect(repository.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if breed not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new breed', async () => {
      const createDto = { name: 'Holstein', description: 'Dairy breed' };
      const createdBreed = { id: '1', ...createDto, active: true, createdAt: new Date(), updatedAt: new Date() };
      repository.create.mockResolvedValue(createdBreed as Breed);

      const result = await service.create(createDto);

      expect(result).toEqual(createdBreed);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a breed', async () => {
      const updateDto = { name: 'Updated Holstein' };
      const updatedBreed = { id: '1', name: 'Updated Holstein', description: 'Dairy breed', active: true, createdAt: new Date(), updatedAt: new Date() };
      repository.findOne.mockResolvedValue({ id: '1', name: 'Holstein', description: 'Dairy breed', active: true, createdAt: new Date(), updatedAt: new Date() } as Breed);
      repository.update.mockResolvedValue(updatedBreed as Breed);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedBreed);
      expect(repository.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should throw NotFoundException if breed not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('1', { name: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a breed', async () => {
      repository.findOne.mockResolvedValue({ id: '1', name: 'Holstein', description: 'Dairy breed', active: true, createdAt: new Date(), updatedAt: new Date() } as Breed);
      repository.remove.mockResolvedValue(undefined);

      await service.remove('1');

      expect(repository.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if breed not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
