import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cattle } from '../farm/cattle/entities/cattle.entity';
import { User, UserRole } from '../platform/users/entities/user.entity';
import { Owner } from '../platform/owners/entities/owner.entity';
import { Event } from '../farm/events/entities/event.entity';
import { Treatment } from '../farm/treatments/entities/treatment.entity';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
    constructor(
        @InjectRepository(Cattle)
        private cattleRepository: Repository<Cattle>,
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        @InjectRepository(Owner)
        private ownersRepository: Repository<Owner>,
        @InjectRepository(Event)
        private eventsRepository: Repository<Event>,
        @InjectRepository(Treatment)
        private treatmentsRepository: Repository<Treatment>,
    ) {}

    async getDashboardStats(user: any): Promise<DashboardStatsDto> {
        // Determine if user is SUPER_ADMIN (can see all stats) or owner-specific
        const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
        const ownerId = isSuperAdmin ? null : user.ownerId;

        // Get cattle statistics
        const cattleStats = await this.getCattleStats(ownerId);
        
        // Get events count
        const eventsCount = await this.eventsRepository
            .createQueryBuilder('event')
            .leftJoin('event.cattle', 'cattle')
            .where(ownerId ? 'cattle.ownerId = :ownerId' : '1=1', { ownerId })
            .getCount();

        // Get treatments count
        const treatmentsCount = await this.treatmentsRepository
            .createQueryBuilder('treatment')
            .leftJoin('treatment.cattle', 'cattle')
            .where(ownerId ? 'cattle.ownerId = :ownerId' : '1=1', { ownerId })
            .getCount();

        // Get users count (only for SUPER_ADMIN)
        const usersCount = isSuperAdmin 
            ? await this.usersRepository.count()
            : 0;

        // Get owners count (only for SUPER_ADMIN)
        const ownersCount = isSuperAdmin
            ? await this.ownersRepository.count()
            : 0;

        // Calculate health percentage (assuming healthy cattle = total - sick)
        // This is a simplified calculation - you may want to add a health status field
        const healthyCattle = cattleStats.total; // Assuming all are healthy for now
        const healthPercentage = cattleStats.total > 0 
            ? (healthyCattle / cattleStats.total) * 100 
            : 0;

        return {
            totalCattle: cattleStats.total,
            healthyCattle,
            healthPercentage: Math.round(healthPercentage * 100) / 100,
            totalEvents: eventsCount,
            totalTreatments: treatmentsCount,
            totalUsers: usersCount,
            totalOwners: ownersCount,
            males: cattleStats.males,
            females: cattleStats.females,
        };
    }

    private async getCattleStats(ownerId: string | null) {
        const qb = this.cattleRepository.createQueryBuilder('cattle');
        
        if (ownerId) {
            qb.where('cattle.ownerId = :ownerId', { ownerId });
        }

        const stats = await qb
            .select('COUNT(cattle.id)', 'total')
            .addSelect("COUNT(CASE WHEN cattle.gender = 'M' THEN 1 END)", 'males')
            .addSelect("COUNT(CASE WHEN cattle.gender = 'F' THEN 1 END)", 'females')
            .getRawOne();

        return {
            total: parseInt(stats.total || '0', 10),
            males: parseInt(stats.males || '0', 10),
            females: parseInt(stats.females || '0', 10),
        };
    }
}
