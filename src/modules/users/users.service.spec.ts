import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt');

import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersMapper } from './users.mapper';
import { User, UserRole } from './entities/user.entity';

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'user-1',
    name: 'Alice',
    email: 'alice@example.com',
    hashedPassword: 'hashed_password',
    role: UserRole.OWNER_USER,
    ownerId: 'owner-1',
    isActive: true,
    owner: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as User);

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

const makeUsersRepoMock = () => ({
  findAllWithRelations: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn((data: any) => ({ ...data })),
  save: jest.fn(async (user: any) => user),
  remove: jest.fn(),
});

// ──────────────────────────────────────────────
//  Tests
// ──────────────────────────────────────────────

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: ReturnType<typeof makeUsersRepoMock>;

  beforeEach(async () => {
    usersRepo = makeUsersRepoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  // ── findAll ──────────────────────────────────

  describe('findAll()', () => {
    it('OWNER_USER : ForbiddenException', async () => {
      await expect(service.findAll({}, makeOwnerUser() as any))
        .rejects.toThrow(ForbiddenException);
    });

    it('SUPER_ADMIN : passe ownerId null', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 20 };
      usersRepo.findAllWithRelations.mockResolvedValue(mockResult);

      await service.findAll({}, makeSuperAdmin() as any);

      expect(usersRepo.findAllWithRelations).toHaveBeenCalled();
    });

    it('retourne les données mappées', async () => {
      const user = makeUser();
      usersRepo.findAllWithRelations.mockResolvedValue({ data: [user], total: 1, page: 1, limit: 20 });
      jest.spyOn(UsersMapper, 'toResponseList').mockReturnValue([{ id: 'user-1' }] as any);

      const result = await service.findAll({}, makeSuperAdmin() as any);

      expect(result.data).toEqual([{ id: 'user-1' }]);
    });
  });

  // ── findOne ──────────────────────────────────

  describe('findOne()', () => {
    it('retourne l\'utilisateur mappé', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      const result = await service.findOne('user-1', makeSuperAdmin() as any);

      expect(result).toEqual({ id: 'user-1' });
    });

    it('NotFoundException si absent', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });

    it('ForbiddenException si pas autorisé', async () => {
      const user = makeUser({ ownerId: 'owner-2' });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(service.findOne('user-1', makeOwnerUser() as any))
        .rejects.toThrow(ForbiddenException);
    });
  });

  // ── create ───────────────────────────────────

  describe('create()', () => {
    it('BadRequestException si email déjà enregistré', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.create({ name: 'Alice', email: 'alice@example.com', password: 'pass' } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('crée un nouvel utilisateur haché', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');

      const result = await service.create({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret123',
      } as any);

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'bob@example.com',
          hashedPassword: 'hashed_new_password',
        }),
      );
      expect(result).toBeDefined();
    });
  });

  // ── update ───────────────────────────────────

  describe('update()', () => {
    it('NotFoundException si absent', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('unknown', {} as any, makeSuperAdmin() as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('ForbiddenException si pas autorisé', async () => {
      const user = makeUser({ ownerId: 'owner-2' });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(
        service.update('user-1', {} as any, makeOwnerUser() as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('met à jour et retourne l\'utilisateur', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { name: 'Updated Name' } as any;

      await service.update('user-1', dto, makeSuperAdmin() as any);

      expect(user.name).toBe('Updated Name');
      expect(usersRepo.save).toHaveBeenCalledWith(user);
    });

    it('hache le mot de passe si fourni', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed');
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { password: 'newpassword' } as any;

      await service.update('user-1', dto, makeSuperAdmin() as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(dto.hashedPassword).toBe('new_hashed');
      expect(dto.password).toBeUndefined();
    });
  });

  // ── remove ───────────────────────────────────

  describe('remove()', () => {
    it('NotFoundException si absent', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('unknown', makeSuperAdmin() as any))
        .rejects.toThrow(NotFoundException);
    });

    it('ForbiddenException si pas autorisé', async () => {
      const user = makeUser({ ownerId: 'owner-2' });
      usersRepo.findOne.mockResolvedValue(user);

      await expect(
        service.remove('user-1', makeOwnerUser() as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('supprime et retourne la réponse mappée', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.remove.mockResolvedValue(undefined);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      const result = await service.remove('user-1', makeSuperAdmin() as any);

      expect(usersRepo.remove).toHaveBeenCalledWith(user);
      expect(result).toEqual({ id: 'user-1' });
    });
  });

  // ── findByEmail ─────────────────────────────

  describe('findByEmail()', () => {
    it('retourne l\'utilisateur par email', async () => {
      const user = makeUser();
      usersRepo.findOne.mockResolvedValue(user);

      const result = await service.findByEmail('alice@example.com');

      expect(result).toEqual(user);
      expect(usersRepo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { email: 'alice@example.com' } }),
      );
    });

    it('retourne null si introuvable', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });
  });
});
