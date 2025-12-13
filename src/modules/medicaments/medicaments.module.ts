import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicamentsService } from './medicaments.service';
import { MedicamentsController } from './medicaments.controller';
import { Medicament } from '../../entities/medicament.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Medicament])],
    controllers: [MedicamentsController],
    providers: [MedicamentsService],
    exports: [MedicamentsService],
})
export class MedicamentsModule { }
