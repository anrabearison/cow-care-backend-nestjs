import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VeterinariansService } from './veterinarians.service';
import { VeterinariansController } from './veterinarians.controller';
import { Veterinarian } from './entities/veterinarian.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { VeterinariansRepository } from './veterinarians.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Veterinarian, Organization])],
    controllers: [VeterinariansController],
    providers: [VeterinariansService, VeterinariansRepository],
    exports: [VeterinariansService],
})
export class VeterinariansModule { }
