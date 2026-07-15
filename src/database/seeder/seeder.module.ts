import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import configuration from '../../config/configuration';
import { getTypeOrmConfig } from '../../config/database.config';
import { SeederService } from './seeder.service';

import { Category } from '../../modules/platform/categories/entities/category.entity';
import { Character } from '../../modules/platform/characters/entities/character.entity';
import { Status } from '../../modules/platform/status/entities/status.entity';
import { EventType } from '../../modules/platform/event-types/entities/event-type.entity';
import { Medicament } from '../../modules/platform/medicaments/entities/medicament.entity';
import { Veterinarian } from '../../modules/veterinarians/entities/veterinarian.entity';
import { Owner } from '../../modules/platform/owners/entities/owner.entity';
import { User } from '../../modules/platform/users/entities/user.entity';
import { HerdBook } from '../../modules/farm/herd-books/entities/herd-book.entity';
import { Cattle } from '../../modules/farm/cattle/entities/cattle.entity';
import { HerdBookCattle } from '../../modules/farm/herd-book-cattle/entities/herd-book-cattle.entity';
import { Event } from '../../modules/farm/events/entities/event.entity';
import { Treatment } from '../../modules/farm/treatments/entities/treatment.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => getTypeOrmConfig(configService),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Category,
      Character,
      Status,
      EventType,
      Medicament,
      Veterinarian,
      Owner,
      User,
      HerdBook,
      Cattle,
      HerdBookCattle,
      Event,
      Treatment,
    ]),
  ],
  providers: [SeederService],
})
export class SeederModule {}
