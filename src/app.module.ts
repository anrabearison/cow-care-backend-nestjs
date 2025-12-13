import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { getTypeOrmConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { CattleModule } from './modules/cattle/cattle.module';
import { EventsModule } from './modules/events/events.module';
import { TreatmentsModule } from './modules/treatments/treatments.module';
import { UsersModule } from './modules/users/users.module';
import { OwnersModule } from './modules/owners/owners.module';
import { UploadModule } from './modules/upload/upload.module';
import { ExportsModule } from './modules/exports/exports.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { StatusModule } from './modules/status/status.module';
import { CharactersModule } from './modules/characters/characters.module';
import { EventTypesModule } from './modules/event-types/event-types.module';
import { MedicamentsModule } from './modules/medicaments/medicaments.module';
import { VeterinariansModule } from './modules/veterinarians/veterinarians.module';
import { HerdBooksModule } from './modules/herd-books/herd-books.module';
import { HerdBookCattleModule } from './modules/herd-book-cattle/herd-book-cattle.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
            inject: [ConfigService],
        }),
        // Feature modules will be imported here
        AuthModule,
        CattleModule,
        EventsModule,
        TreatmentsModule,
        UsersModule,
        OwnersModule,
        UploadModule,
        ExportsModule,
        CategoriesModule,
        StatusModule,
        CharactersModule,
        EventTypesModule,
        MedicamentsModule,
        VeterinariansModule,
        HerdBooksModule,
        HerdBookCattleModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule { }
