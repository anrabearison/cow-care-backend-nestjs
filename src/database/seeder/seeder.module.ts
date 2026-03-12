import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import configuration from '../../config/configuration';
import { getTypeOrmConfig } from '../../config/database.config';
import { SeederService } from './seeder.service';

import { Category } from '../../entities/category.entity';
import { Character } from '../../entities/character.entity';
import { Status } from '../../entities/status.entity';
import { EventType } from '../../entities/event-type.entity';
import { Medicament } from '../../entities/medicament.entity';
import { Veterinarian } from '../../entities/veterinarian.entity';
import { Owner } from '../../entities/owner.entity';
import { User } from '../../entities/user.entity';
import { HerdBook } from '../../entities/herd-book.entity';
import { Cattle } from '../../entities/cattle.entity';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { Event } from '../../entities/event.entity';
import { Treatment } from '../../entities/treatment.entity';

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
