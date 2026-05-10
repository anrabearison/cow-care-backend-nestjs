import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { HerdBookCattleService } from './herd-book-cattle.service';
import { HerdBookCattleController } from './herd-book-cattle.controller';
import { CattleModule } from '../cattle/cattle.module';
import { HerdBookCattleRepository } from './herd-book-cattle.repository';

@Module({
    imports: [TypeOrmModule.forFeature([HerdBookCattle]), CattleModule],
    providers: [HerdBookCattleService, HerdBookCattleRepository],
    controllers: [HerdBookCattleController],
})
export class HerdBookCattleModule { }
