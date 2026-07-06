import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Invitation } from '../entities/invitation.entity';
import { UserRole } from '../../users/entities/user.entity';
import { CreateInvitationDto } from '../dto/invitation.dto';
import * as crypto from 'crypto';

@Injectable()
export class InvitationService {
    constructor(
        @InjectRepository(Invitation)
        private invitationsRepository: Repository<Invitation>,
    ) {}

    async createInvitation(dto: CreateInvitationDto): Promise<Invitation> {
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
            role: dto.role,
            ownerId: dto.ownerId,
            token,
            expiresAt,
        });

        return this.invitationsRepository.save(invitation);
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

    async findAll(filter?: { email?: string }): Promise<Invitation[]> {
        if (filter?.email) {
            return this.invitationsRepository.find({
                where: {
                    email: ILike(`%${filter.email}%`),
                },
                order: { createdAt: 'DESC' },
            });
        }

        return this.invitationsRepository.find({
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
