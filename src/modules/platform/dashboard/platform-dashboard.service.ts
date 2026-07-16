import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Owner } from '../owners/entities/owner.entity';
import { Invitation } from '../../auth/entities/invitation.entity';
import { PlatformDashboardStatsDto } from './dto/platform-dashboard-stats.dto';

@Injectable()
export class PlatformDashboardService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Owner)
        private ownersRepository: Repository<Owner>,
        @InjectRepository(Invitation)
        private invitationsRepository: Repository<Invitation>,
    ) {}

    async getPlatformStats(): Promise<PlatformDashboardStatsDto> {
        const totalOwners = await this.ownersRepository.count();
        const totalUsers = await this.usersRepository.count();
        const totalPendingInvitations = await this.invitationsRepository
            .createQueryBuilder('invitation')
            .where('invitation.status = :status', { status: 'PENDING' })
            .getCount();

        return {
            totalOwners,
            totalUsers,
            totalPendingInvitations,
        };
    }
}
