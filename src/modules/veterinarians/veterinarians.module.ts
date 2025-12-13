import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VeterinariansService } from './veterinarians.service';
import { VeterinariansController } from './veterinarians.controller';
import { Veterinarian } from '../../entities/veterinarian.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Veterinarian])],
    controllers: [VeterinariansController],
    providers: [VeterinariansService],
    exports: [VeterinariansService],
})
export class VeterinariansModule { }
