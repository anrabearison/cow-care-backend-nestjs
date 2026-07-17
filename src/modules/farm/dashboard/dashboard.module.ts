import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Cattle } from '../farm/cattle/entities/cattle.entity';
import { User } from '../platform/users/entities/user.entity';
import { Owner } from '../platform/owners/entities/owner.entity';
import { Event } from '../farm/events/entities/event.entity';
import { Treatment } from '../farm/treatments/entities/treatment.entity';

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
