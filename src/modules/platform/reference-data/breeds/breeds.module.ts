import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Breed } from './breeds.entity';
import { BreedsController } from './breeds.controller';
import { BreedsService } from './breeds.service';
import { BreedsRepository } from './breeds.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Breed])],
  controllers: [BreedsController],
  providers: [BreedsService, BreedsRepository],
  exports: [BreedsService],
})
export class BreedsModule {}
