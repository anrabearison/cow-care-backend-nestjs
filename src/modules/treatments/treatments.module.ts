import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentsService } from './treatments.service';
import { TreatmentsController } from './treatments.controller';
import { Treatment } from './entities/treatment.entity';
import { TreatmentsRepository } from './treatments.repository';
import { Organization } from '../organizations/entities/organization.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Treatment, Organization]),
    ],
    controllers: [TreatmentsController],
    providers: [TreatmentsService, TreatmentsRepository],
    exports: [TreatmentsService],
})
export class TreatmentsModule { }
