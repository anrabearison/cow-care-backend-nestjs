import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { Organization } from './entities/organization.entity';
import { OrganizationsRepository } from './organizations.repository';
import { CommonModule } from '../../common/common.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Organization]),
        CommonModule,
    ],
    controllers: [OrganizationsController],
    providers: [OrganizationsService, OrganizationsRepository],
    exports: [OrganizationsService],
})
export class OrganizationsModule { }
