import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnersService } from './owners.service';
import { OwnersController } from './owners.controller';
import { Owner } from './entities/owner.entity';
import { OwnersRepository } from './owners.repository';

@Module({
    imports: [
        TypeOrmModule.forFeature([Owner]),
    ],
    controllers: [OwnersController],
    providers: [OwnersService, OwnersRepository],
    exports: [OwnersService],
})
export class OwnersModule { }
