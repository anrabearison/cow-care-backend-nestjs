import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import configuration from '../../config/configuration';
import { getTypeOrmConfig } from '../../config/database.config';
import { SeederService } from './seeder.service';

import { Category } from '../../modules/categories/entities/category.entity';
import { Character } from '../../modules/characters/entities/character.entity';
import { Status } from '../../modules/status/entities/status.entity';
import { EventType } from '../../modules/event-types/entities/event-type.entity';
import { Medicament } from '../../modules/medicaments/entities/medicament.entity';
import { Veterinarian } from '../../modules/veterinarians/entities/veterinarian.entity';
import { Owner } from '../../modules/owners/entities/owner.entity';
import { User } from '../../modules/users/entities/user.entity';
import { HerdBook } from '../../modules/herd-books/entities/herd-book.entity';
import { Cattle } from '../../modules/cattle/entities/cattle.entity';
import { HerdBookCattle } from '../../modules/herd-book-cattle/entities/herd-book-cattle.entity';
import { Event } from '../../modules/events/entities/event.entity';
import { Treatment } from '../../modules/treatments/entities/treatment.entity';

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
