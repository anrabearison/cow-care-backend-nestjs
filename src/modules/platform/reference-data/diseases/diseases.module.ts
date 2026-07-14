import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Disease } from './diseases.entity';
import { DiseasesController } from './diseases.controller';
import { DiseasesService } from './diseases.service';
import { DiseasesRepository } from './diseases.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Disease])],
  controllers: [DiseasesController],
  providers: [DiseasesService, DiseasesRepository],
  exports: [DiseasesService],
})
export class DiseasesModule {}
