import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusService } from './status.service';
import { StatusController } from './status.controller';
import { Status } from './entities/status.entity';
import { StatusRepository } from './status.repository';

@Module({
    imports: [TypeOrmModule.forFeature([Status])],
    controllers: [StatusController],
    providers: [StatusService, StatusRepository],
    exports: [StatusService],
})
export class StatusModule { }
