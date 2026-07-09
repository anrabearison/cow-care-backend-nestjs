import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
jest.mock('bcrypt');

import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { UsersMapper } from './users.mapper';
import { User, UserRole } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

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
    it('BadRequestException si ownerId manquant', async () => {
      await expect(
        service.create({ name: 'Alice', email: 'alice@example.com', password: 'pass' } as any, makeSuperAdmin() as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('BadRequestException si email déjà enregistré', async () => {
      usersRepo.findOne.mockResolvedValue(makeUser());

      await expect(
        service.create({ name: 'Alice', email: 'alice@example.com', password: 'pass', ownerId: 'owner-1' } as any, makeSuperAdmin() as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('crée un nouvel utilisateur haché', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null); // Email check
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password');
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      const result = await service.create({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret123',
        ownerId: 'owner-1',
      } as any, makeSuperAdmin() as any);

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'bob@example.com',
          hashedPassword: 'hashed_new_password',
        }),
      );
      expect(result).toBeDefined();
    });

    it('OWNER_ADMIN ne peut créer que OWNER_USER', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null); // Email check
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });

      await expect(
        service.create({
          name: 'Bob',
          email: 'bob@example.com',
          password: 'secret123',
          ownerId: 'owner-1',
          role: UserRole.OWNER_ADMIN, // Tentative de créer un OWNER_ADMIN
        } as any, ownerAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('OWNER_ADMIN peut créer OWNER_USER', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null); // Email check
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      usersRepo.save.mockResolvedValue({});
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });

      const result = await service.create({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret123',
        ownerId: 'owner-1',
        role: UserRole.OWNER_USER,
      } as any, ownerAdmin);

      expect(result).toBeDefined();
    });

    it('OWNER_ADMIN utilise OWNER_USER par défaut si aucun rôle spécifié', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null); // Email check
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      usersRepo.save.mockResolvedValue({});
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });

      const result = await service.create({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret123',
        ownerId: 'owner-1',
        // Pas de rôle spécifié
      } as any, ownerAdmin);

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.OWNER_USER,
        }),
      );
    });

    it('SUPER_ADMIN peut créer n\'importe quel rôle', async () => {
      usersRepo.findOne.mockResolvedValueOnce(null); // Email check
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
      usersRepo.save.mockResolvedValue({});
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      const result = await service.create({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret123',
        role: UserRole.OWNER_ADMIN,
        ownerId: 'owner-1',
      } as any, makeSuperAdmin() as any);

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

    // Tests pour la modification de rôle
    it('SUPER_ADMIN peut modifier n\'importe quel rôle', async () => {
      const user = makeUser({ role: UserRole.OWNER_USER });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { role: UserRole.OWNER_ADMIN } as any;

      await service.update('user-1', dto, makeSuperAdmin() as any);

      expect(user.role).toBe(UserRole.OWNER_ADMIN);
    });

    it('OWNER_ADMIN peut modifier le rôle d\'un utilisateur du même owner', async () => {
      const user = makeUser({ role: UserRole.OWNER_USER, ownerId: 'owner-1' });
      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { role: UserRole.OWNER_USER } as any;

      await service.update('user-1', dto, ownerAdmin);

      expect(user.role).toBe(UserRole.OWNER_USER);
    });

    it('OWNER_ADMIN ne peut pas modifier le rôle d\'un SUPER_ADMIN', async () => {
      const user = makeUser({ role: UserRole.SUPER_ADMIN, ownerId: null });
      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });
      usersRepo.findOne.mockResolvedValue(user);

      const dto = { role: UserRole.OWNER_USER } as any;

      await expect(
        service.update('user-1', dto, ownerAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('OWNER_ADMIN ne peut pas attribuer le rôle SUPER_ADMIN', async () => {
      const user = makeUser({ role: UserRole.OWNER_USER, ownerId: 'owner-1' });
      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });
      usersRepo.findOne.mockResolvedValue(user);

      const dto = { role: UserRole.SUPER_ADMIN } as any;

      await expect(
        service.update('user-1', dto, ownerAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Utilisateur ne peut pas modifier son propre rôle', async () => {
      const user = makeUser({ id: 'user-1', role: UserRole.OWNER_USER });
      usersRepo.findOne.mockResolvedValue(user);

      const dto = { role: UserRole.OWNER_ADMIN } as any;

      await expect(
        service.update('user-1', dto, user),
      ).rejects.toThrow(ForbiddenException);
    });

    // Tests pour la modification de isActive
    it('SUPER_ADMIN peut activer/désactiver n\'importe quel utilisateur', async () => {
      const user = makeUser({ isActive: true });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { isActive: false } as any;

      await service.update('user-1', dto, makeSuperAdmin() as any);

      expect(user.isActive).toBe(false);
    });

    it('OWNER_ADMIN peut activer/désactiver un utilisateur du même owner', async () => {
      const user = makeUser({ id: 'user-2', isActive: true, ownerId: 'owner-1' });
      const ownerAdmin = makeUser({ id: 'user-1', role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);
      usersRepo.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(user);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({} as any);

      const dto = { isActive: false } as any;

      await service.update('user-2', dto, ownerAdmin);

      expect(user.isActive).toBe(false);
    });

    it('OWNER_ADMIN ne peut pas modifier un compte SUPER_ADMIN', async () => {
      const user = makeUser({ role: UserRole.SUPER_ADMIN, ownerId: null });
      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });
      usersRepo.findOne.mockResolvedValue(user);

      const dto = { isActive: false } as any;

      await expect(
        service.update('user-1', dto, ownerAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('OWNER_ADMIN ne peut pas se désactiver lui-même', async () => {
      const ownerAdmin = makeUser({ id: 'user-1', role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });
      usersRepo.findOne.mockResolvedValue(ownerAdmin);

      const dto = { isActive: false } as any;

      await expect(
        service.update('user-1', dto, ownerAdmin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Utilisateur ne peut pas modifier son propre isActive', async () => {
      const user = makeUser({ id: 'user-1', isActive: true });
      usersRepo.findOne.mockResolvedValue(user);

      const dto = { isActive: false } as any;

      await expect(
        service.update('user-1', dto, user),
      ).rejects.toThrow(ForbiddenException);
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

    it('désactive l\'utilisateur au lieu de le supprimer', async () => {
      const user = makeUser({ isActive: true });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      const result = await service.remove('user-1', makeSuperAdmin() as any);

      expect(user.isActive).toBe(false);
      expect(usersRepo.save).toHaveBeenCalledWith(user);
      expect(usersRepo.remove).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'user-1' });
    });

    it('SUPER_ADMIN peut désactiver n\'importe quel utilisateur', async () => {
      const user = makeUser({ isActive: true });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      await service.remove('user-1', makeSuperAdmin() as any);

      expect(user.isActive).toBe(false);
    });

    it('OWNER_ADMIN peut désactiver un utilisateur du même owner', async () => {
      const user = makeUser({ isActive: true, ownerId: 'owner-1' });
      const ownerAdmin = makeUser({ role: UserRole.OWNER_ADMIN, ownerId: 'owner-1' });
      usersRepo.findOne.mockResolvedValue(user);
      usersRepo.save.mockResolvedValue(user);
      jest.spyOn(UsersMapper, 'toResponse').mockReturnValue({ id: 'user-1' } as any);

      await service.remove('user-1', ownerAdmin);

      expect(user.isActive).toBe(false);
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
