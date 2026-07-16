import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Owner } from '../owners/entities/owner.entity';
import { Invitation } from '../../auth/entities/invitation.entity';
import { PlatformDashboardService } from './platform-dashboard.service';
import { PlatformDashboardController } from './platform-dashboard.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Owner, Invitation]),
    ],
    controllers: [PlatformDashboardController],
    providers: [PlatformDashboardService],
    exports: [PlatformDashboardService],
})
export class PlatformDashboardModule {}
