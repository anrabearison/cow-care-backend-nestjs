import { Controller, Get, Post, Put, Delete, Param, Query, Body, Req, Res, HttpStatus, UseGuards } from '@nestjs/common';
import { HerdBookCattleService } from './herd-book-cattle.service';
import { CreateHerdBookCattleDto } from './dto/create-herd-book-cattle.dto';
import { UpdateHerdBookCattleDto } from './dto/update-herd-book-cattle.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('herd-book-cattle')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HerdBookCattleController {
  constructor(private readonly service: HerdBookCattleService) { }

  @Get()
  async findAll(@Query() query, @Req() req: Request, @Res() res: Response) {
    const result = await this.service.findAll(query, req.user);
    res.set('Content-Range', `herd_book_cattle ${(result.page - 1) * result.perPage}-${(result.page - 1) * result.perPage + result.data.length}/${result.total}`);
    res.set('X-Total-Count', result.total.toString());
    res.set('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');
    res.json(result);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateHerdBookCattleDto, @Req() req: Request) {
    return await this.service.create(dto, (req as any).user);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateHerdBookCattleDto) {
    return await this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    const result = await this.service.remove(id);
    res.status(HttpStatus.OK).json(result);
  }
}
