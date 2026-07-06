import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthProvider, AuthProviderType } from '../entities/auth-provider.entity';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthProviderService {
    constructor(
        @InjectRepository(AuthProvider)
        private authProvidersRepository: Repository<AuthProvider>,
    ) {}

    async findByProviderAndUserId(
        provider: AuthProviderType,
        providerUserId: string,
    ): Promise<AuthProvider | null> {
        return this.authProvidersRepository.findOne({
            where: { provider, providerUserId },
            relations: ['user'],
        });
    }

    async findByUser(userId: string): Promise<AuthProvider[]> {
        return this.authProvidersRepository.find({
            where: { user: { id: userId } },
        });
    }

    async createLocalProvider(user: User, password: string): Promise<AuthProvider> {
        const passwordHash = await bcrypt.hash(password, 10);
        const authProvider = this.authProvidersRepository.create({
            user,
            provider: AuthProviderType.LOCAL,
            passwordHash,
        });
        return this.authProvidersRepository.save(authProvider);
    }

    async createOAuthProvider(
        user: User,
        provider: AuthProviderType,
        providerUserId: string,
    ): Promise<AuthProvider> {
        const authProvider = this.authProvidersRepository.create({
            user,
            provider,
            providerUserId,
        });
        return this.authProvidersRepository.save(authProvider);
    }

    async linkOAuthProvider(
        user: User,
        provider: AuthProviderType,
        providerUserId: string,
    ): Promise<AuthProvider> {
        // Vérifier si ce providerUserId est déjà lié à un autre utilisateur
        const existingProvider = await this.findByProviderAndUserId(provider, providerUserId);
        if (existingProvider) {
            if (existingProvider.user.id === user.id) {
                // Déjà lié au même utilisateur
                return existingProvider;
            }
            throw new ConflictException(
                `Ce compte ${provider} est déjà associé à un autre utilisateur`,
            );
        }

        // Vérifier si l'utilisateur a déjà ce provider
        const userProvider = await this.authProvidersRepository.findOne({
            where: { user: { id: user.id }, provider },
        });

        if (userProvider) {
            // Mettre à jour le providerUserId
            userProvider.providerUserId = providerUserId;
            return this.authProvidersRepository.save(userProvider);
        }

        // Créer un nouveau provider
        return this.createOAuthProvider(user, provider, providerUserId);
    }

    async updateLastLogin(authProvider: AuthProvider): Promise<void> {
        authProvider.lastLoginAt = new Date();
        await this.authProvidersRepository.save(authProvider);
    }

    async unlinkProvider(userId: string, provider: AuthProviderType): Promise<void> {
        const authProvider = await this.authProvidersRepository.findOne({
            where: { user: { id: userId }, provider },
        });

        if (!authProvider) {
            throw new NotFoundException('Provider non trouvé pour cet utilisateur');
        }

        // Empêcher de dissocier le dernier provider
        const userProviders = await this.findByUser(userId);
        if (userProviders.length <= 1) {
            throw new ConflictException(
                'Vous ne pouvez pas dissocier votre dernier moyen de connexion',
            );
        }

        await this.authProvidersRepository.remove(authProvider);
    }

    async getUserProviders(userId: string): Promise<AuthProvider[]> {
        return this.findByUser(userId);
    }
}
