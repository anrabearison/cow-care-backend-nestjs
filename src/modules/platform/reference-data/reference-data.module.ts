import { Module } from '@nestjs/common';
import { ReferenceDataController } from './reference-data.controller';
import { ReferenceDataService } from './reference-data.service';
import { BreedsController } from './breeds/breeds.controller';
import { BreedsService } from './breeds/breeds.service';
import { VaccinesController } from './vaccines/vaccines.controller';
import { VaccinesService } from './vaccines/vaccines.service';
import { DiseasesController } from './diseases/diseases.controller';
import { DiseasesService } from './diseases/diseases.service';
import { MedicamentsController } from './medicaments/medicaments.controller';
import { MedicamentsService } from './medicaments/medicaments.service';
import { CategoriesController } from './categories/categories.controller';
import { CategoriesService } from './categories/categories.service';
import { EventTypesController } from './event-types/event-types.controller';
import { EventTypesService } from './event-types/event-types.service';
import { StatusesController } from './statuses/statuses.controller';
import { StatusesService } from './statuses/statuses.service';
import { CharactersController } from './characters/characters.controller';
import { CharactersService } from './characters/characters.service';
import { MedicamentsModule } from '../../medicaments/medicaments.module';
import { CategoriesModule } from '../../categories/categories.module';
import { EventTypesModule } from '../../event-types/event-types.module';
import { StatusModule } from '../../status/status.module';
import { CharactersModule } from '../../characters/characters.module';

@Module({
  imports: [
    MedicamentsModule,
    CategoriesModule,
    EventTypesModule,
    StatusModule,
    CharactersModule,
  ],
  controllers: [
    ReferenceDataController,
    BreedsController,
    VaccinesController,
    DiseasesController,
    MedicamentsController,
    CategoriesController,
    EventTypesController,
    StatusesController,
    CharactersController,
  ],
  providers: [
    ReferenceDataService,
    BreedsService,
    VaccinesService,
    DiseasesService,
    MedicamentsService,
    CategoriesService,
    EventTypesService,
    StatusesService,
    CharactersService,
  ],
  exports: [
    ReferenceDataService,
    BreedsService,
    VaccinesService,
    DiseasesService,
    MedicamentsService,
    CategoriesService,
    EventTypesService,
    StatusesService,
    CharactersService,
  ],
})
export class ReferenceDataModule {}
