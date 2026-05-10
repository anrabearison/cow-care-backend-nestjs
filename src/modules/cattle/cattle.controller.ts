import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { CattleService } from './cattle.service';
import { CreateCattleDto } from './dto/create-cattle.dto';
import { CattleQueryDto } from './dto/cattle-query.dto';
import { User } from '../../entities/user.entity';
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
        return this.cattleService.getStatistics(ownerId, req.user as User);
    }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of cattle' })
    async findAll(@Query() query: CattleQueryDto, @Res({ passthrough: true }) res: Response, @Req() req) {
        const result = await this.cattleService.findAll(query, req.user as User);

        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');

        return result;
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific cattle' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.cattleService.findOne(id, req.user as User);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new cattle' })
    create(@Body() createCattleDto: CreateCattleDto, @Query('herdBookId') herdBookId: string, @Req() req) {
        // If herdBookId is passed as query param, inject it into DTO
        if (herdBookId) {
            createCattleDto.herdBookId = herdBookId;
        }
        return this.cattleService.create(createCattleDto, req.user as User);
    }

    @Post(':id/birth')
    @ApiOperation({ summary: 'Register a birth' })
    registerBirth(@Param('id') id: string, @Body() birthData: any, @Req() req) {
        return this.cattleService.registerBirth(id, birthData, req.user as User);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a cattle' })
    update(@Param('id') id: string, @Body() updateCattleDto: any, @Req() req) {
        return this.cattleService.update(id, updateCattleDto, req.user as User);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a cattle' })
    remove(@Param('id') id: string, @Req() req) {
        return this.cattleService.remove(id, req.user as User);
    }
}
