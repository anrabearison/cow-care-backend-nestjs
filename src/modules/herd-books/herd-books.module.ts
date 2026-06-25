import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HerdBooksService } from './herd-books.service';
import { HerdBooksController } from './herd-books.controller';
import { HerdBook } from './entities/herd-book.entity';
import { HerdBooksRepository } from './herd-books.repository';

@Module({
    imports: [TypeOrmModule.forFeature([HerdBook])],
    controllers: [HerdBooksController],
    providers: [HerdBooksService, HerdBooksRepository],
    exports: [HerdBooksService],
})
export class HerdBooksModule { }
