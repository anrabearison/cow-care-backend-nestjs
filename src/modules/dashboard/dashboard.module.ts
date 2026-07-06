import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Cattle } from '../cattle/entities/cattle.entity';
import { User } from '../users/entities/user.entity';
import { Owner } from '../owners/entities/owner.entity';
import { Event } from '../events/entities/event.entity';
import { Treatment } from '../treatments/entities/treatment.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Cattle,
            User,
            Owner,
            Event,
            Treatment,
        ]),
    ],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule {}
