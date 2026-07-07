import {BadRequestException, Injectable, UnauthorizedException, NotFoundException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import * as bcrypt from 'bcrypt';
import {User, UserRole} from '../users/entities/user.entity';
import {RegisterDto} from './dto/register.dto';
import {AuthProviderService} from './services/auth-provider.service';
import {AuthProviderType} from './entities/auth-provider.entity';
import {InvitationService} from './services/invitation.service';
import {GoogleOAuthService} from './services/google-oauth.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
        private authProviderService: AuthProviderService,
        private invitationService: InvitationService,
        private googleOAuthService: GoogleOAuthService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersRepository.findOne({
            where: { email },
            relations: ['owner']
        });

        if (!user) {
            return null;
        }

        // Vérifier via AuthProviderService
        const authProvider = await this.authProviderService.findByUser(user.id);
        const localProvider = authProvider?.find(ap => ap.provider === AuthProviderType.LOCAL);

        if (localProvider && await bcrypt.compare(pass, localProvider.passwordHash)) {
            const { hashedPassword, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { sub: user.email, id: user.id, role: user.role, ownerId: user.ownerId };
        // Transformer l'utilisateur pour inclure ownerId
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            ownerId: user.ownerId,
            owner: user.owner,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        
        // Mettre à jour lastLoginAt pour le provider LOCAL
        const authProviders = await this.authProviderService.findByUser(user.id);
        const localProvider = authProviders?.find(ap => ap.provider === AuthProviderType.LOCAL);
        if (localProvider) {
            await this.authProviderService.updateLastLogin(localProvider);
        }
        
        return {
            access_token: this.jwtService.sign(payload),
            token_type: 'Bearer',
            user: userResponse,
        };
    }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersRepository.findOne({
            where: { email: registerDto.email }
        });

        if (existingUser) {
            throw new BadRequestException('Email already registered');
        }

        const newUser = this.usersRepository.create({
            name: registerDto.name,
            email: registerDto.email,
            id: crypto.randomUUID(),
            role: UserRole.OWNER_USER,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.usersRepository.save(newUser);

        // Créer le AuthProvider LOCAL
        await this.authProviderService.createLocalProvider(newUser, registerDto.password);

        const { hashedPassword: _, ...result } = newUser;
        return result;
    }

    /**
     * Resolve the current user for JWT validation.
     * `sub` is the user id for new tokens; legacy tokens may still use email as `sub`.
     */
    async resolveUserFromJwtSubject(sub: string) {
        const where = sub.includes('@') ? { email: sub } : { id: sub };
        const user = await this.usersRepository.findOne({
            where,
            relations: ['owner'],
        });

        if (!user) {
            return null;
        }

        const { hashedPassword, ...result } = user;
        return result;
    }

    async getProfile(email: string) {
        const user = await this.usersRepository.findOne({
            where: { email },
            relations: ['owner']
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        const { hashedPassword, ...result } = user;
        return result;
    }

    async loginWithGoogle(code: string, invitationToken?: string) {
        // Échanger le code contre les tokens Google
        const tokens = await this.googleOAuthService.exchangeCodeForTokens(code);
        
        // Vérifier le token ID
        const googleProfile = await this.googleOAuthService.verifyIdToken(tokens.id_token);
        
        if (!googleProfile.emailVerified) {
            throw new BadRequestException('Votre compte Google n\'est pas verifying. Veuillez vérifier votre email avec Google.');
        }

        // Chercher un AuthProvider Google existant
        const existingAuthProvider = await this.authProviderService.findByProviderAndUserId(
            AuthProviderType.GOOGLE,
            googleProfile.sub,
        );

        if (existingAuthProvider) {
            // Compte déjà lié - connexion directe
            await this.authProviderService.updateLastLogin(existingAuthProvider);
            return this.login(existingAuthProvider.user);
        }

        // Si un utilisateur existe déjà avec cet email mais sans provider Google, lier le provider
        const existingUserByEmail = await this.usersRepository.findOne({ where: { email: googleProfile.email } });
        if (existingUserByEmail) {
            // Lier le provider Google à l'utilisateur existant (vérifie les conflits)
            const linkedProvider = await this.authProviderService.linkOAuthProvider(
                existingUserByEmail,
                AuthProviderType.GOOGLE,
                googleProfile.sub,
            );

            // Marquer invitation comme utilisée si fournie
            if (invitationToken) {
                try {
                    await this.invitationService.markAsUsed(invitationToken);
                } catch (err) {
                    // Ignore if invalid/used — linking still proceeds
                }
            }

            await this.authProviderService.updateLastLogin(linkedProvider);
            return this.login(existingUserByEmail);
        }

        // Si pas d'invitation, refuser la création automatique
        if (!invitationToken) {
            throw new UnauthorizedException(
                'Aucun compte trouvé. Veuillez utiliser une invitation pour créer un compte ou connectez-vous avec votre compte local pour lier Google.',
            );
        }

        // Valider l'invitation
        const invitation = await this.invitationService.validateInvitation(invitationToken);

        // Vérifier que l'email Google correspond à l'email de l'invitation
        if (googleProfile.email !== invitation.email) {
            throw new BadRequestException(
                'L\'email Google ne correspond pas à l\'email de l\'invitation',
            );
        }

        // Créer l'utilisateur et le provider Google dans une transaction
        const newUser = this.usersRepository.create({
            name: googleProfile.email.split('@')[0], // Nom basé sur l'email
            email: googleProfile.email,
            role: invitation.role,
            ownerId: invitation.ownerId,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.usersRepository.save(newUser);

        // Créer le AuthProvider Google
        const authProvider = await this.authProviderService.createOAuthProvider(
            newUser,
            AuthProviderType.GOOGLE,
            googleProfile.sub,
        );

        // Marquer l'invitation comme utilisée
        await this.invitationService.markAsUsed(invitationToken);

        // Mettre à jour lastLoginAt
        await this.authProviderService.updateLastLogin(authProvider);

        return this.login(newUser);
    }

    async linkGoogleAccount(userId: string, code: string) {
        // Échanger le code contre les tokens Google
        const tokens = await this.googleOAuthService.exchangeCodeForTokens(code);
        
        // Vérifier le token ID
        const googleProfile = await this.googleOAuthService.verifyIdToken(tokens.id_token);
        
        if (!googleProfile.emailVerified) {
            throw new BadRequestException('Votre compte Google n\'est pas vérifié. Veuillez vérifier votre email avec Google.');
        }

        // Récupérer l'utilisateur
        const user = await this.usersRepository.findOne({
            where: { id: userId },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        // Vérifier que l'email Google correspond à l'email de l'utilisateur
        if (googleProfile.email !== user.email) {
            throw new BadRequestException(
                'L\'email Google ne correspond pas à l\'email de votre compte',
            );
        }

        // Lier le compte Google
        const authProvider = await this.authProviderService.linkOAuthProvider(
            user,
            AuthProviderType.GOOGLE,
            googleProfile.sub,
        );

        await this.authProviderService.updateLastLogin(authProvider);

        return authProvider;
    }

    async unlinkProvider(userId: string, provider: AuthProviderType) {
        await this.authProviderService.unlinkProvider(userId, provider);
    }

    async getUserProviders(userId: string) {
        const authProviders = await this.authProviderService.getUserProviders(userId);
        
        return authProviders.map(ap => ({
            provider: ap.provider,
            linked: true,
            providerUserId: ap.providerUserId,
            lastLoginAt: ap.lastLoginAt,
        }));
    }
}
