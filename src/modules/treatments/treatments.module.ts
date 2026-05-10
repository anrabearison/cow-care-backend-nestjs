import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TreatmentsService } from './treatments.service';
import { TreatmentsController } from './treatments.controller';
import { Treatment } from '../../entities/treatment.entity';
import { TreatmentsRepository } from './treatments.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([Treatment]),
    ],
    controllers: [TreatmentsController],
    providers: [TreatmentsService, TreatmentsRepository],
    exports: [TreatmentsService],
})
export class TreatmentsModule { }
