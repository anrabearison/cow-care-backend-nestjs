import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DiseasesService } from './diseases.service';
import { DiseasesRepository } from './diseases.repository';
import { Disease } from './diseases.entity';

describe('DiseasesService', () => {
  let service: DiseasesService;
  let repository: jest.Mocked<DiseasesRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiseasesService,
        {
          provide: DiseasesRepository,
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

    service = module.get<DiseasesService>(DiseasesService);
    repository = module.get(DiseasesRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated diseases', async () => {
      const expectedResult = {
        items: [{ id: '1', name: 'Foot and Mouth Disease', description: 'Viral disease', symptoms: 'Fever, blisters', treatment: 'Vaccination', prevention: 'Biosecurity', active: true, createdAt: new Date(), updatedAt: new Date() }],
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
    it('should return a disease', async () => {
      const disease = { id: '1', name: 'Foot and Mouth Disease', description: 'Viral disease', symptoms: 'Fever, blisters', treatment: 'Vaccination', prevention: 'Biosecurity', active: true, createdAt: new Date(), updatedAt: new Date() };
      repository.findOne.mockResolvedValue(disease as Disease);

      const result = await service.findOne('1');

      expect(result).toEqual(disease);
      expect(repository.findOne).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if disease not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a new disease', async () => {
      const createDto = { name: 'Foot and Mouth Disease', description: 'Viral disease' };
      const createdDisease = { id: '1', ...createDto, symptoms: null, treatment: null, prevention: null, active: true, createdAt: new Date(), updatedAt: new Date() };
      repository.create.mockResolvedValue(createdDisease as Disease);

      const result = await service.create(createDto);

      expect(result).toEqual(createdDisease);
      expect(repository.create).toHaveBeenCalledWith(createDto);
    });
  });

  describe('update', () => {
    it('should update a disease', async () => {
      const updateDto = { name: 'Updated Disease' };
      const updatedDisease = { id: '1', name: 'Updated Disease', description: 'Viral disease', symptoms: 'Fever, blisters', treatment: 'Vaccination', prevention: 'Biosecurity', active: true, createdAt: new Date(), updatedAt: new Date() };
      repository.findOne.mockResolvedValue({ id: '1', name: 'Foot and Mouth Disease', description: 'Viral disease', symptoms: 'Fever, blisters', treatment: 'Vaccination', prevention: 'Biosecurity', active: true, createdAt: new Date(), updatedAt: new Date() } as Disease);
      repository.update.mockResolvedValue(updatedDisease as Disease);

      const result = await service.update('1', updateDto);

      expect(result).toEqual(updatedDisease);
      expect(repository.update).toHaveBeenCalledWith('1', updateDto);
    });

    it('should throw NotFoundException if disease not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('1', { name: 'Updated' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a disease', async () => {
      repository.findOne.mockResolvedValue({ id: '1', name: 'Foot and Mouth Disease', description: 'Viral disease', symptoms: 'Fever, blisters', treatment: 'Vaccination', prevention: 'Biosecurity', active: true, createdAt: new Date(), updatedAt: new Date() } as Disease);
      repository.remove.mockResolvedValue(undefined);

      await service.remove('1');

      expect(repository.remove).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if disease not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('1')).rejects.toThrow(NotFoundException);
    });
  });
});
