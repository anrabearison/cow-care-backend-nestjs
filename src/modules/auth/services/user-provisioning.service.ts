import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../platform/users/entities/user.entity';
import { AuthProvider, AuthProviderType } from '../entities/auth-provider.entity';
import { AuthProviderService } from './auth-provider.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface CreateUserOptions {
    role: UserRole;
    ownerId?: string;
    isActive?: boolean;
}

export interface CreateUserResult {
    user: User;
    authProvider?: AuthProvider;
}

@Injectable()
export class UserProvisioningService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
        private readonly authProviderService: AuthProviderService,
    ) {}

    /**
     * Crée un utilisateur sans écrire dans users.hashedPassword
     * et crée l'AuthProvider LOCAL si un mot de passe est fourni
     */
    async createUser(
        name: string,
        email: string,
        password: string | null,
        options: CreateUserOptions,
    ): Promise<CreateUserResult> {
        const { role, ownerId, isActive = true } = options;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await this.usersRepository.findOne({
            where: { email },
        });

        if (existingUser) {
            throw new Error('User already exists');
        }

        // Créer l'utilisateur SANS hashedPassword
        const newUser = this.usersRepository.create({
            id: crypto.randomUUID(),
            name,
            email,
            role,
            ownerId,
            isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.usersRepository.save(newUser);

        let authProvider: AuthProvider | undefined;

        // Créer l'AuthProvider LOCAL uniquement si un mot de passe est fourni
        if (password) {
            authProvider = await this.authProviderService.createLocalProvider(
                newUser,
                password,
            );
        }

        return { user: newUser, authProvider };
    }

    /**
     * Met à jour ou crée l'AuthProvider LOCAL pour un utilisateur
     * Ne touche jamais à users.hashedPassword
     */
    async updateUserPassword(
        user: User,
        newPassword: string,
    ): Promise<AuthProvider> {
        // Récupérer les providers existants
        const authProviders = await this.authProviderService.findByUser(user.id);
        const localProvider = authProviders.find(
            (ap) => ap.provider === AuthProviderType.LOCAL,
        );

        if (localProvider) {
            // Mettre à jour le provider existant
            const passwordHash = await bcrypt.hash(newPassword, 10);
            localProvider.passwordHash = passwordHash;
            return await this.authProviderService['authProvidersRepository'].save(
                localProvider,
            );
        } else {
            // Créer un nouveau provider LOCAL
            return await this.authProviderService.createLocalProvider(
                user,
                newPassword,
            );
        }
    }
}
