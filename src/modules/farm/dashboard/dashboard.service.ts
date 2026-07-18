import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cattle } from '../cattle/entities/cattle.entity';
import { User, UserRole } from '../../platform/users/entities/user.entity';
import { Owner } from '../../platform/owners/entities/owner.entity';
import { Event } from '../events/entities/event.entity';
import { Treatment } from '../treatments/entities/treatment.entity';
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
        // Only OWNER_ADMIN and OWNER_USER can access business stats
        const ownerId = user.ownerId;
        if (!ownerId) {
            throw new Error('User must have an ownerId to access business stats');
        }

        // Get cattle statistics
        const cattleStats = await this.getCattleStats(ownerId);
        
        // Get events count
        const eventsCount = await this.eventsRepository
            .createQueryBuilder('event')
            .leftJoin('event.cattle', 'cattle')
            .where('cattle.ownerId = :ownerId', { ownerId })
            .getCount();

        // Get treatments count
        const treatmentsCount = await this.treatmentsRepository
            .createQueryBuilder('treatment')
            .leftJoin('treatment.cattle', 'cattle')
            .where('cattle.ownerId = :ownerId', { ownerId })
            .getCount();

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
            totalUsers: 0, // Not applicable for business stats
            totalOwners: 0, // Not applicable for business stats
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
