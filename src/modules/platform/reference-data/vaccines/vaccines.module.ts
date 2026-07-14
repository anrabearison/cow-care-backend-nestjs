import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vaccine } from './vaccines.entity';
import { VaccinesController } from './vaccines.controller';
import { VaccinesService } from './vaccines.service';
import { VaccinesRepository } from './vaccines.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Vaccine])],
  controllers: [VaccinesController],
  providers: [VaccinesService, VaccinesRepository],
  exports: [VaccinesService],
})
export class VaccinesModule {}
