import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { AuthProviderService } from './auth-provider.service';
import { AuthProviderType, AuthProvider } from '../entities/auth-provider.entity';
import { User, UserRole } from '../../platform/users/entities/user.entity';

jest.mock('bcrypt');

describe('AuthProviderService', () => {
  let service: AuthProviderService;
  let authProvidersRepository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  const mockedBcryptHash = bcrypt.hash as jest.Mock;

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

  const makeAuthProvider = (overrides: Partial<AuthProvider> = {}): AuthProvider =>
    ({
      id: 'provider-1',
      provider: AuthProviderType.LOCAL,
      providerUserId: null,
      passwordHash: null,
      user: makeUser(),
      lastLoginAt: null,
      ...overrides,
    } as AuthProvider);

  beforeEach(() => {
    authProvidersRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((data: any) => ({ ...data })),
      save: jest.fn(async (provider: any) => ({ ...provider })),
      remove: jest.fn(async (provider: any) => provider),
    };

    service = new AuthProviderService(authProvidersRepository as any);

    mockedBcryptHash.mockReset();
  });

  describe('createLocalProvider()', () => {
    it('should hash the password with 10 salt rounds and save a LOCAL provider', async () => {
      const user = makeUser();
      mockedBcryptHash.mockResolvedValue('hashed_password');

      const result = await service.createLocalProvider(user, 'secret123');

      expect(mockedBcryptHash).toHaveBeenCalledWith('secret123', 10);
      expect(authProvidersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          provider: AuthProviderType.LOCAL,
          passwordHash: 'hashed_password',
        }),
      );
      expect(authProvidersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        user,
        provider: AuthProviderType.LOCAL,
        passwordHash: 'hashed_password',
      }));
      expect(result).toEqual(expect.objectContaining({
        user,
        provider: AuthProviderType.LOCAL,
        passwordHash: 'hashed_password',
      }));
    });
  });

  describe('createOAuthProvider()', () => {
    it('should save an OAuth provider with the correct provider type and user id', async () => {
      const user = makeUser();
      const result = await service.createOAuthProvider(user, AuthProviderType.GOOGLE, 'google-123');

      expect(authProvidersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          provider: AuthProviderType.GOOGLE,
          providerUserId: 'google-123',
        }),
      );
      expect(authProvidersRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          provider: AuthProviderType.GOOGLE,
          providerUserId: 'google-123',
        }),
      );
      expect(result).toEqual(expect.objectContaining({
        user,
        provider: AuthProviderType.GOOGLE,
        providerUserId: 'google-123',
      }));
    });
  });

  describe('linkOAuthProvider()', () => {
    const user = makeUser();

    it('should create a new provider when none exists for this user', async () => {
      authProvidersRepository.findOne.mockImplementation(async (options: any) => {
        if (options?.where?.providerUserId) {
          return null;
        }
        if (options?.where?.user?.id) {
          return null;
        }
        return null;
      });

      const result = await service.linkOAuthProvider(user, AuthProviderType.GOOGLE, 'google-123');

      expect(authProvidersRepository.findOne).toHaveBeenCalledTimes(2);
      expect(authProvidersRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user,
          provider: AuthProviderType.GOOGLE,
          providerUserId: 'google-123',
        }),
      );
      expect(authProvidersRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        provider: AuthProviderType.GOOGLE,
        providerUserId: 'google-123',
      }));
      expect(result).toEqual(expect.objectContaining({
        providerUserId: 'google-123',
        provider: AuthProviderType.GOOGLE,
      }));
    });

    it('should return the existing provider if it is already linked to the same user', async () => {
      const existingProvider = makeAuthProvider({
        provider: AuthProviderType.GOOGLE,
        providerUserId: 'google-123',
        user,
      });

      authProvidersRepository.findOne.mockResolvedValue(existingProvider);

      const result = await service.linkOAuthProvider(user, AuthProviderType.GOOGLE, 'google-123');

      expect(result).toBe(existingProvider);
      expect(authProvidersRepository.save).not.toHaveBeenCalled();
      expect(authProvidersRepository.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the provider is already linked to another user', async () => {
      const otherUser = makeUser({ id: 'user-2', email: 'bob@example.com' });
      const existingProvider = makeAuthProvider({
        provider: AuthProviderType.GOOGLE,
        providerUserId: 'google-123',
        user: otherUser,
      });

      authProvidersRepository.findOne.mockResolvedValue(existingProvider);

      await expect(
        service.linkOAuthProvider(user, AuthProviderType.GOOGLE, 'google-123'),
      ).rejects.toThrow(ConflictException);
      await expect(
        service.linkOAuthProvider(user, AuthProviderType.GOOGLE, 'google-123'),
      ).rejects.toThrow('Ce compte GOOGLE est déjà associé à un autre utilisateur');
    });

    it('should update an existing provider for the same user when providerUserId differs', async () => {
      const existingUserProvider = makeAuthProvider({
        provider: AuthProviderType.GOOGLE,
        providerUserId: 'google-old',
        user,
      });

      authProvidersRepository.findOne.mockImplementation(async (options: any) => {
        if (options?.where?.providerUserId) {
          return null;
        }
        return existingUserProvider;
      });

      authProvidersRepository.save.mockImplementation(async (provider: any) => provider);

      const result = await service.linkOAuthProvider(user, AuthProviderType.GOOGLE, 'google-new');

      expect(result.providerUserId).toBe('google-new');
      expect(authProvidersRepository.save).toHaveBeenCalledWith(existingUserProvider);
      expect(authProvidersRepository.create).not.toHaveBeenCalledWith(
        expect.objectContaining({ provider: AuthProviderType.GOOGLE }),
      );
    });
  });

  describe('unlinkProvider()', () => {
    const user = makeUser();

    it('should remove a provider when multiple providers exist', async () => {
      const authProvider = makeAuthProvider({ provider: AuthProviderType.GOOGLE, user });
      authProvidersRepository.findOne.mockResolvedValue(authProvider);
      authProvidersRepository.find.mockResolvedValue([authProvider, makeAuthProvider({ provider: AuthProviderType.LOCAL, user })]);

      await service.unlinkProvider(user.id, AuthProviderType.GOOGLE);

      expect(authProvidersRepository.remove).toHaveBeenCalledWith(authProvider);
    });

    it('should throw NotFoundException if provider is not found for the user', async () => {
      authProvidersRepository.findOne.mockResolvedValue(null);

      await expect(service.unlinkProvider(user.id, AuthProviderType.GOOGLE)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.unlinkProvider(user.id, AuthProviderType.GOOGLE)).rejects.toThrow(
        'Provider non trouvé pour cet utilisateur',
      );
    });

    it('should throw ConflictException if unlinking the last provider', async () => {
      const authProvider = makeAuthProvider({ provider: AuthProviderType.GOOGLE, user });
      authProvidersRepository.findOne.mockResolvedValue(authProvider);
      authProvidersRepository.find.mockResolvedValue([authProvider]);

      await expect(service.unlinkProvider(user.id, AuthProviderType.GOOGLE)).rejects.toThrow(
        ConflictException,
      );
      await expect(service.unlinkProvider(user.id, AuthProviderType.GOOGLE)).rejects.toThrow(
        'Vous ne pouvez pas dissocier votre dernier moyen de connexion',
      );
    });
  });

  describe('updateLastLogin()', () => {
    it('should update lastLoginAt and save the provider', async () => {
      const authProvider = makeAuthProvider({ lastLoginAt: new Date('2024-01-01') });

      await service.updateLastLogin(authProvider);

      expect(authProvider.lastLoginAt).toBeInstanceOf(Date);
      expect(authProvider.lastLoginAt.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime());
      expect(authProvidersRepository.save).toHaveBeenCalledWith(authProvider);
    });
  });

  describe('findByProviderAndUserId(), findByUser(), getUserProviders()', () => {
    it('should query the repository by provider and providerUserId', async () => {
      const expected = makeAuthProvider({ provider: AuthProviderType.GOOGLE, providerUserId: 'google-123' });
      authProvidersRepository.findOne.mockResolvedValue(expected);

      const result = await service.findByProviderAndUserId(AuthProviderType.GOOGLE, 'google-123');

      expect(authProvidersRepository.findOne).toHaveBeenCalledWith({
        where: { provider: AuthProviderType.GOOGLE, providerUserId: 'google-123' },
        relations: ['user'],
      });
      expect(result).toBe(expected);
    });

    it('should query the repository by user id', async () => {
      const expected = [makeAuthProvider({ user: makeUser() })];
      authProvidersRepository.find.mockResolvedValue(expected);

      const result = await service.findByUser('user-1');

      expect(authProvidersRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' } },
      });
      expect(result).toBe(expected);
    });

    it('should return user providers via getUserProviders()', async () => {
      const expected = [makeAuthProvider({ user: makeUser() })];
      authProvidersRepository.find.mockResolvedValue(expected);

      const result = await service.getUserProviders('user-1');

      expect(result).toBe(expected);
      expect(authProvidersRepository.find).toHaveBeenCalledWith({
        where: { user: { id: 'user-1' } },
      });
    });
  });
});
