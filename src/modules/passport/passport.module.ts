import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportService } from './passport.service';
import { PassportController } from './passport.controller';
import { Passport } from './entities/passport.entity';
import { HerdBookCattlePassport } from './entities/herd-book-cattle-passport.entity';
import { PassportCattleSnapshot } from './entities/passport-cattle-snapshot.entity';
import { PassportAudit } from './entities/passport-audit.entity';
import { Applicant } from './entities/applicant.entity';
import { Location } from './entities/location.entity';
import { PassportRepository } from './passport.repository';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { HerdBook } from '../herd-books/entities/herd-book.entity';
import { User } from '../users/entities/user.entity';
import { PdfMakeService } from './pdf-make.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Passport,
            HerdBookCattlePassport,
            PassportCattleSnapshot,
            PassportAudit,
            Applicant,
            Location,
            HerdBookCattle,
            HerdBook,
            User,
        ]),
    ],
    controllers: [PassportController],
    // DataSource est automatiquement disponible via InjectDataSource() quand TypeOrmModule est importé
    providers: [PassportService, PassportRepository, PdfMakeService],
    exports: [PassportService],
})
export class PassportModule {}
