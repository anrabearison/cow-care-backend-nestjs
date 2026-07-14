import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
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
import { PurchasesModule } from './modules/purchases/purchases.module';
import { PassportModule } from './modules/passport/passport.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthModule } from './modules/health/health.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CsrfGuard } from './modules/auth/guards/csrf.guard';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [configuration],
        }),
        ThrottlerModule.forRoot([{
            ttl: 60000, // 1 minute
            limit: 100, // 100 requêtes par minute (défaut permissif pour les routes normales)
        }]),
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
        PurchasesModule,
        PassportModule,
        DashboardModule,
        HealthModule,
        OrganizationsModule,
    ],
    controllers: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: APP_GUARD,
            useClass: CsrfGuard,
        },
    ],
})
export class AppModule { }
