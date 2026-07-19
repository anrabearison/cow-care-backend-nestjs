import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProvisioningService } from './user-provisioning.service';
import { User, UserRole } from '../../platform/users/entities/user.entity';
import { AuthProvider, AuthProviderType } from '../entities/auth-provider.entity';
import { AuthProviderService } from './auth-provider.service';
import { BadRequestException } from '@nestjs/common';

describe('UserProvisioningService', () => {
    let service: UserProvisioningService;
    let usersRepository: jest.Mocked<Repository<User>>;
    let authProviderService: jest.Mocked<AuthProviderService>;

    const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.OWNER_USER,
        isActive: true,
        ownerId: 'owner-1',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockAuthProvider = {
        id: 'ap-1',
        provider: AuthProviderType.LOCAL,
        providerUserId: 'test@example.com',
        passwordHash: 'hashed_password',
        user: mockUser,
        lastLoginAt: null,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserProvisioningService,
                {
                    provide: getRepositoryToken(User),
                    useValue: {
                        create: jest.fn(),
                        save: jest.fn(),
                        findOne: jest.fn(),
                    },
                },
                {
                    provide: AuthProviderService,
                    useValue: {
                        createLocalProvider: jest.fn(),
                        findByUser: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserProvisioningService>(UserProvisioningService);
        usersRepository = module.get(getRepositoryToken(User));
        authProviderService = module.get(AuthProviderService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('createUser()', () => {
        it('should create user with password and AuthProvider LOCAL', async () => {
            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue(mockUser as any);
            usersRepository.save.mockResolvedValue(mockUser as any);
            authProviderService.createLocalProvider.mockResolvedValue(mockAuthProvider as any);

            const result = await service.createUser(
                'Test User',
                'test@example.com',
                'password123',
                {
                    role: UserRole.OWNER_USER,
                    ownerId: 'owner-1',
                    isActive: true,
                },
            );

            expect(usersRepository.findOne).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
            });
            expect(usersRepository.create).toHaveBeenCalledWith({
                id: expect.any(String),
                name: 'Test User',
                email: 'test@example.com',
                role: UserRole.OWNER_USER,
                ownerId: 'owner-1',
                isActive: true,
                createdAt: expect.any(Date),
                updatedAt: expect.any(Date),
            });
            expect(usersRepository.save).toHaveBeenCalled();
            expect(authProviderService.createLocalProvider).toHaveBeenCalledWith(
                mockUser,
                'password123',
            );
            expect(result.user).toEqual(mockUser);
            expect(result.authProvider).toEqual(mockAuthProvider);
        });

        it('should create user without password (no AuthProvider)', async () => {
            usersRepository.findOne.mockResolvedValue(null);
            usersRepository.create.mockReturnValue(mockUser as any);
            usersRepository.save.mockResolvedValue(mockUser as any);

            const result = await service.createUser(
                'Test User',
                'test@example.com',
                null,
                {
                    role: UserRole.OWNER_USER,
                    ownerId: 'owner-1',
                    isActive: true,
                },
            );

            expect(usersRepository.create).toHaveBeenCalled();
            expect(usersRepository.save).toHaveBeenCalled();
            expect(authProviderService.createLocalProvider).not.toHaveBeenCalled();
            expect(result.user).toEqual(mockUser);
            expect(result.authProvider).toBeUndefined();
        });

        it('should throw error if user already exists', async () => {
            usersRepository.findOne.mockResolvedValue(mockUser as any);

            await expect(
                service.createUser(
                    'Test User',
                    'test@example.com',
                    'password123',
                    {
                        role: UserRole.OWNER_USER,
                        ownerId: 'owner-1',
                        isActive: true,
                    },
                ),
            ).rejects.toThrow('User already exists');
        });
    });

    describe('updateUserPassword()', () => {
        it('should update existing LOCAL AuthProvider', async () => {
            authProviderService.findByUser.mockResolvedValue([mockAuthProvider as any]);
            const mockUpdatedProvider = { ...mockAuthProvider, passwordHash: 'new_hash' };
            (authProviderService as any)['authProvidersRepository'] = {
                save: jest.fn().mockResolvedValue(mockUpdatedProvider),
            };

            const result = await service.updateUserPassword(mockUser as any, 'newPassword');

            expect(authProviderService.findByUser).toHaveBeenCalledWith(mockUser.id);
            expect((authProviderService as any)['authProvidersRepository'].save).toHaveBeenCalled();
            expect(result.passwordHash).toBe('new_hash');
        });

        it('should create new LOCAL AuthProvider if none exists', async () => {
            authProviderService.findByUser.mockResolvedValue([]);
            authProviderService.createLocalProvider.mockResolvedValue(mockAuthProvider as any);

            const result = await service.updateUserPassword(mockUser as any, 'newPassword');

            expect(authProviderService.findByUser).toHaveBeenCalledWith(mockUser.id);
            expect(authProviderService.createLocalProvider).toHaveBeenCalledWith(
                mockUser,
                'newPassword',
            );
            expect(result).toEqual(mockAuthProvider);
        });
    });
});
