import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { HerdBookCattleService } from './herd-book-cattle.service';
import { HerdBookCattleController } from './herd-book-cattle.controller';
import { CattleModule } from '../cattle/cattle.module';

@Module({
    imports: [TypeOrmModule.forFeature([HerdBookCattle]), CattleModule],
    providers: [HerdBookCattleService],
    controllers: [HerdBookCattleController],
})
export class HerdBookCattleModule { }
