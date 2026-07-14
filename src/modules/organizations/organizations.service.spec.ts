import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';

import { OrganizationsService } from './organizations.service';
import { OrganizationsRepository } from './organizations.repository';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeOrganization = (overrides: any = {}) => ({
  id: 'org-1',
  name: 'Test Organization',
  code: 'TEST001',
  description: 'Test description',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeOrganizationsRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOne: jest.fn(),
  findByCode: jest.fn(),
  create: jest.fn((data: any) => data),
  save: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let organizationsRepo: ReturnType<typeof makeOrganizationsRepoMock>;

  beforeEach(async () => {
    organizationsRepo = makeOrganizationsRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: OrganizationsRepository, useValue: organizationsRepo },
      ],
    }).compile();

    service = module.get(OrganizationsService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('retourne les données mappées', async () => {
      const organization = makeOrganization();
      organizationsRepo.findAllWithRelations.mockResolvedValue({ data: [organization], total: 1, page: 1, limit: 20 });

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).not.toHaveProperty('users');
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne l\'organisation mappée', async () => {
      const organization = makeOrganization();
      organizationsRepo.findOne.mockResolvedValue(organization);

      const result = await service.findOne('org-1');

      expect(result).toHaveProperty('id', 'org-1');
      expect(result).not.toHaveProperty('users');
    });

    it('NotFoundException si absent', async () => {
      organizationsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('crée une organisation et la retourne', async () => {
      const dto = {
        name: 'New Organization',
        code: 'NEW001',
        description: 'New description',
        isActive: true,
      };

      const savedOrganization = makeOrganization({ code: 'NEW001' });
      organizationsRepo.findByCode.mockResolvedValue(null);
      organizationsRepo.create.mockReturnValue(savedOrganization);
      organizationsRepo.save.mockResolvedValue(savedOrganization);

      const result = await service.create(dto as any);

      expect(organizationsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'NEW001', name: 'New Organization' }),
      );
      expect(organizationsRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('code', 'NEW001');
    });

    it('ConflictException si le code existe déjà', async () => {
      const dto = {
        name: 'New Organization',
        code: 'EXIST001',
      };

      organizationsRepo.findByCode.mockResolvedValue(makeOrganization({ code: 'EXIST001' }));

      await expect(service.create(dto as any))
        .rejects.toThrow(ConflictException);
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      organizationsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('met à jour et retourne l\'organisation', async () => {
      const organization = makeOrganization();
      organizationsRepo.findOne.mockResolvedValue(organization);
      organizationsRepo.save.mockResolvedValue(organization);
      organizationsRepo.findByCode.mockResolvedValue(null);
      organizationsRepo.findOne.mockResolvedValueOnce(organization).mockResolvedValueOnce(organization);

      const dto = { name: 'Updated Organization', description: 'Updated description' } as any;

      await service.update('org-1', dto);

      expect(organization.name).toBe('Updated Organization');
      expect(organization.description).toBe('Updated description');
      expect(organizationsRepo.save).toHaveBeenCalledWith(organization);
    });

    it('ConflictException si le code existe déjà', async () => {
      const organization = makeOrganization({ code: 'OLD001' });
      organizationsRepo.findOne.mockResolvedValue(organization);
      organizationsRepo.findByCode.mockResolvedValue(makeOrganization({ code: 'EXIST001' }));

      const dto = { code: 'EXIST001' } as any;

      await expect(service.update('org-1', dto))
        .rejects.toThrow(ConflictException);
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('désactive et retourne l\'organisation', async () => {
      const organization = makeOrganization({ isActive: true });
      organizationsRepo.findOne.mockResolvedValue(organization);
      organizationsRepo.save.mockResolvedValue(organization);

      const result = await service.remove('org-1');

      expect(organization.isActive).toBe(false);
      expect(organizationsRepo.save).toHaveBeenCalledWith(organization);
      expect(result).toHaveProperty('isActive', false);
    });

    it('NotFoundException si absent', async () => {
      organizationsRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── activate ─────────────────────────────────

  describe('activate()', () => {
    it('active l\'organisation', async () => {
      const organization = makeOrganization({ isActive: false });
      organizationsRepo.findOne.mockResolvedValue(organization);
      organizationsRepo.save.mockResolvedValue(organization);

      const result = await service.activate('org-1');

      expect(organization.isActive).toBe(true);
      expect(organizationsRepo.save).toHaveBeenCalledWith(organization);
      expect(result).toHaveProperty('isActive', true);
    });

    it('NotFoundException si absent', async () => {
      organizationsRepo.findOne.mockResolvedValue(null);

      await expect(service.activate('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });

  // ── deactivate ───────────────────────────────

  describe('deactivate()', () => {
    it('désactive l\'organisation', async () => {
      const organization = makeOrganization({ isActive: true });
      organizationsRepo.findOne.mockResolvedValue(organization);
      organizationsRepo.save.mockResolvedValue(organization);

      const result = await service.deactivate('org-1');

      expect(organization.isActive).toBe(false);
      expect(organizationsRepo.save).toHaveBeenCalledWith(organization);
      expect(result).toHaveProperty('isActive', false);
    });

    it('NotFoundException si absent', async () => {
      organizationsRepo.findOne.mockResolvedValue(null);

      await expect(service.deactivate('unknown'))
        .rejects.toThrow(NotFoundException);
    });
  });
});
