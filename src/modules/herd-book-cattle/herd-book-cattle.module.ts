import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { HerdBookCattleService } from './herd-book-cattle.service';
import { HerdBookCattleController } from './herd-book-cattle.controller';

@Module({
    imports: [TypeOrmModule.forFeature([HerdBookCattle])],
    providers: [HerdBookCattleService],
    controllers: [HerdBookCattleController],
})
export class HerdBookCattleModule { }
