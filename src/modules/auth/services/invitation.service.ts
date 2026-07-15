import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Invitation } from '../entities/invitation.entity';
import { CreateInvitationDto } from '../dto/invitation.dto';
import * as crypto from 'crypto';
import { EmailService } from '../../../common/services/email.service';
import { UserRole } from '../../platform/users/entities/user.entity';

@Injectable()
export class InvitationService {
    private readonly logger = new Logger(InvitationService.name);

    constructor(
        @InjectRepository(Invitation)
        private invitationsRepository: Repository<Invitation>,
        private emailService: EmailService,
    ) {}

    async createInvitation(dto: CreateInvitationDto, currentUser: any): Promise<Invitation> {
        // Force role and ownerId based on caller's role - never trust payload
        let effectiveRole = dto.role;
        let effectiveOwnerId = dto.ownerId;

        if (currentUser.role === UserRole.OWNER_ADMIN) {
            // OWNER_ADMIN can only create OWNER_USER invitations for their own owner
            effectiveRole = UserRole.OWNER_USER;
            effectiveOwnerId = currentUser.ownerId;
        } else if (currentUser.role === UserRole.SUPER_ADMIN) {
            // SUPER_ADMIN can create any role/ownerId
            effectiveRole = dto.role;
            effectiveOwnerId = dto.ownerId;
        } else {
            // Other roles cannot create invitations
            throw new ForbiddenException('Only SUPER_ADMIN and OWNER_ADMIN can create invitations');
        }

        // Vérifier si une invitation existe déjà pour cet email et n'est pas expirée
        const existingInvitation = await this.invitationsRepository.findOne({
            where: { email: dto.email, usedAt: null },
            order: { createdAt: 'DESC' },
        });

        if (existingInvitation && existingInvitation.expiresAt > new Date()) {
            throw new BadRequestException(
                'Une invitation existe déjà pour cet email et n\'est pas encore expirée',
            );
        }

        // Générer un token unique
        const token = crypto.randomUUID();

        // L'invitation expire dans 7 jours par défaut
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = this.invitationsRepository.create({
            email: dto.email,
            role: effectiveRole,
            ownerId: effectiveOwnerId,
            token,
            expiresAt,
        });

        const saved = await this.invitationsRepository.save(invitation);

        // Send invitation email asynchronously (fire & forget) to avoid timeout
        // This prevents blocking the response while Gmail SMTP is sending
        setImmediate(async () => {
            try {
                this.logger.log(`Sending invitation email to ${saved.email}...`);
                await this.emailService.sendInvitationEmail(saved.email, saved.token);
                this.logger.log(`Invitation email sent successfully to ${saved.email}`);
            } catch (err: any) {
                this.logger.error(
                    `Failed to send invitation email to ${saved.email}: ${err?.message ?? err}`,
                    err?.stack,
                );
                this.logger.error(
                    `SMTP error details — code: ${err?.code}, command: ${err?.command}, responseCode: ${err?.responseCode}`,
                );
            }
        });

        return saved;
    }

    async validateInvitation(token: string): Promise<Invitation> {
        const invitation = await this.invitationsRepository.findOne({
            where: { token },
        });

        if (!invitation) {
            throw new NotFoundException('Invitation non trouvée');
        }

        if (invitation.usedAt) {
            throw new BadRequestException('Cette invitation a déjà été utilisée');
        }

        if (invitation.expiresAt < new Date()) {
            throw new BadRequestException('Cette invitation a expiré');
        }

        return invitation;
    }

    async markAsUsed(token: string): Promise<void> {
        const invitation = await this.validateInvitation(token);
        invitation.usedAt = new Date();
        await this.invitationsRepository.save(invitation);
    }

    async cleanupExpiredInvitations(): Promise<void> {
        await this.invitationsRepository
            .createQueryBuilder()
            .delete()
            .where('expires_at < :now', { now: new Date() })
            .andWhere('used_at IS NULL')
            .execute();
    }

    async findAll(filter?: { email?: string }, currentUser?: any): Promise<Invitation[]> {
        // Apply ownerId filter for non-SUPER_ADMIN users
        let whereCondition: any = {};
        
        if (filter?.email) {
            whereCondition.email = ILike(`%${filter.email}%`);
        }
        
        if (currentUser && currentUser.role !== UserRole.SUPER_ADMIN) {
            if (!currentUser.ownerId) {
                throw new ForbiddenException('OWNER_ADMIN must belong to an owner');
            }
            whereCondition.ownerId = currentUser.ownerId;
        }

        return this.invitationsRepository.find({
            where: whereCondition,
            order: { createdAt: 'DESC' },
        });
    }

    async deleteInvitation(id: string): Promise<{ success: boolean }> {
        const result = await this.invitationsRepository.delete(id);

        if (result.affected === 0) {
            throw new NotFoundException('Invitation non trouvée');
        }

        return { success: true };
    }

    async findByToken(token: string): Promise<Invitation> {
        return this.invitationsRepository.findOne({
            where: { token },
        });
    }
}
