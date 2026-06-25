import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { HerdBookCattleService } from './herd-book-cattle.service';
import { CreateHerdBookCattleDto } from './dto/create-herd-book-cattle.dto';
import { UpdateHerdBookCattleDto } from './dto/update-herd-book-cattle.dto';
import { User } from '../users/entities/user.entity';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('herd-book-cattle')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HerdBookCattleController {
  constructor(private readonly service: HerdBookCattleService) { }

  @Get()
  async findAll(@Query() query, @Req() req: Request) {
    return await this.service.findAll(query, req.user as User);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    return await this.service.findOne(id, req.user as User);
  }

  @Post()
  async create(@Body() dto: CreateHerdBookCattleDto, @Req() req: Request) {
    return await this.service.create(dto, req.user as User);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateHerdBookCattleDto, @Req() req: Request) {
    return await this.service.update(id, dto, req.user as User);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: Request) {
    return await this.service.remove(id, req.user as User);
  }
}
