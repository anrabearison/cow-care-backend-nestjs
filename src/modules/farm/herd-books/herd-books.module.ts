import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HerdBooksService } from './herd-books.service';
import { HerdBooksController } from './herd-books.controller';
import { HerdBook } from './entities/herd-book.entity';
import { HerdBooksRepository } from './herd-books.repository';
import { HerdBookCattleModule } from '../herd-book-cattle/herd-book-cattle.module';
import { CsvImportModule } from '../csv-import/csv-import.module';
import { CategoriesRepository } from '../../platform/categories/categories.repository';
import { StatusRepository } from '../../platform/status/status.repository';
import { CharactersRepository } from '../../platform/characters/characters.repository';
import { Category } from '../../platform/categories/entities/category.entity';
import { Status } from '../../platform/status/entities/status.entity';
import { Character } from '../../platform/characters/entities/character.entity';
import { Cattle } from '../cattle/entities/cattle.entity';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { Owner } from '../../platform/owners/entities/owner.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            HerdBook,
            Category,
            Status,
            Character,
            Cattle,
            HerdBookCattle,
            Owner,
        ]),
        HerdBookCattleModule,
        CsvImportModule,
    ],
    controllers: [HerdBooksController],
    providers: [
        HerdBooksService,
        HerdBooksRepository,
        CategoriesRepository,
        StatusRepository,
        CharactersRepository,
    ],
    exports: [HerdBooksService],
})
export class HerdBooksModule { }
