import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HerdBooksService } from './herd-books.service';
import { HerdBooksController } from './herd-books.controller';
import { HerdBook } from './entities/herd-book.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { HerdBooksRepository } from './herd-books.repository';
import { HerdBookCattleModule } from '../herd-book-cattle/herd-book-cattle.module';

@Module({
    imports: [TypeOrmModule.forFeature([HerdBook, Organization]), HerdBookCattleModule],
    controllers: [HerdBooksController],
    providers: [HerdBooksService, HerdBooksRepository],
    exports: [HerdBooksService],
})
export class HerdBooksModule { }
