import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { CattleService } from './cattle.service';
import { CreateCattleDto } from './dto/create-cattle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('cattle')
@ApiBearerAuth()
@Controller('cattle')
@UseGuards(JwtAuthGuard)
export class CattleController {
    constructor(private readonly cattleService: CattleService) { }

    @Get('statistics')
    @ApiOperation({ summary: 'Get cattle statistics' })
    async getStatistics(@Query('owner_id') ownerId: string, @Req() req) {
        return this.cattleService.getStatistics(ownerId, req.user);
    }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of cattle' })
    async findAll(@Query() query, @Res() res: Response, @Req() req) {
        const result = await this.cattleService.findAll(query, req.user);

        res.set('Content-Range', `cattle ${(result.page - 1) * result.per_page}-${(result.page - 1) * result.per_page + result.data.length}/${result.total}`);
        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');

        res.json(result);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific cattle' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.cattleService.findOne(id, req.user);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new cattle' })
    create(@Body() createCattleDto: CreateCattleDto, @Query('herd_book_id') herdBookId: string, @Req() req) {
        // If herd_book_id is passed as query param, inject it into DTO
        if (herdBookId) {
            createCattleDto.herd_book_id = herdBookId;
        }
        return this.cattleService.create(createCattleDto, req.user);
    }

    @Post(':id/birth')
    @ApiOperation({ summary: 'Register a birth' })
    registerBirth(@Param('id') id: string, @Body() birthData: any, @Req() req) {
        return this.cattleService.registerBirth(id, birthData, req.user);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a cattle' })
    update(@Param('id') id: string, @Body() updateCattleDto: any, @Req() req) {
        return this.cattleService.update(id, updateCattleDto, req.user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a cattle' })
    remove(@Param('id') id: string, @Req() req) {
        return this.cattleService.remove(id, req.user);
    }
}
