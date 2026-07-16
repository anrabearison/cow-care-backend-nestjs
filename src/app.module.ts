import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { getTypeOrmConfig } from './config/database.config';
import { AuthModule } from './modules/auth/auth.module';
import { CattleModule } from './modules/farm/cattle/cattle.module';
import { EventsModule } from './modules/farm/events/events.module';
import { TreatmentsModule } from './modules/farm/treatments/treatments.module';
import { UsersModule } from './modules/platform/users/users.module';
import { OwnersModule } from './modules/platform/owners/owners.module';
import { UploadModule } from './modules/upload/upload.module';
import { ExportsModule } from './modules/farm/exports/exports.module';
import { CategoriesModule } from './modules/platform/categories/categories.module';
import { StatusModule } from './modules/platform/status/status.module';
import { CharactersModule } from './modules/platform/characters/characters.module';
import { EventTypesModule } from './modules/platform/event-types/event-types.module';
import { MedicamentsModule } from './modules/platform/medicaments/medicaments.module';
import { VeterinariansModule } from './modules/veterinarians/veterinarians.module';
import { HerdBooksModule } from './modules/farm/herd-books/herd-books.module';
import { HerdBookCattleModule } from './modules/farm/herd-book-cattle/herd-book-cattle.module';
import { PurchasesModule } from './modules/farm/purchases/purchases.module';
import { PassportModule } from './modules/farm/passport/passport.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { PlatformDashboardModule } from './modules/platform/dashboard/platform-dashboard.module';
import { HealthModule } from './modules/farm/health/health.module';
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
        PlatformDashboardModule,
        HealthModule,
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
