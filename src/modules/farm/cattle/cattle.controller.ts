import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CattleService } from './cattle.service';
import { CreateCattleDto } from './dto/create-cattle.dto';
import { UpdateCattleDto } from './dto/update-cattle.dto';
import { RegisterBirthDto } from './dto/register-birth.dto';
import { CattleQueryDto } from './dto/cattle-query.dto';
import { User } from '../../platform/users/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

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
    async findAll(@Query() query: CattleQueryDto, @Req() req) {
        return await this.cattleService.findAll(query, req.user as User);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific cattle' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.cattleService.findOne(id, req.user as User);
    }

    @Post()
    @Throttle({ default: { limit: 100, ttl: 3600000 } }) // 100 insertions/heure par utilisateur
    @ApiOperation({ summary: 'Create a new cattle' })
    @ApiResponse({ status: 429, description: 'Too many insertions, please try again later' })
    create(@Body() createCattleDto: CreateCattleDto, @Query('herdBookId') herdBookId: string, @Req() req) {
        // If herdBookId is passed as query param, inject it into DTO
        if (herdBookId) {
            createCattleDto.herdBookId = herdBookId;
        }
        return this.cattleService.create(createCattleDto, req.user as User);
    }

    @Post(':id/birth')
    @Throttle({ default: { limit: 50, ttl: 3600000 } }) // 50 naissances/heure par utilisateur
    @ApiOperation({ summary: 'Register a birth' })
    @ApiResponse({ status: 429, description: 'Too many insertions, please try again later' })
    registerBirth(@Param('id') id: string, @Body() birthData: RegisterBirthDto, @Req() req) {
        return this.cattleService.registerBirth(id, birthData, req.user as User);
    }

    @Put(':id')
    @Throttle({ default: { limit: 200, ttl: 3600000 } }) // 200 mises à jour/heure par utilisateur
    @ApiOperation({ summary: 'Update a cattle' })
    @ApiResponse({ status: 429, description: 'Too many updates, please try again later' })
    update(@Param('id') id: string, @Body() updateCattleDto: UpdateCattleDto, @Req() req) {
        return this.cattleService.update(id, updateCattleDto, req.user as User);
    }

    @Delete(':id')
    @Throttle({ default: { limit: 50, ttl: 3600000 } }) // 50 suppressions/heure par utilisateur
    @ApiOperation({ summary: 'Delete a cattle' })
    @ApiResponse({ status: 429, description: 'Too many deletions, please try again later' })
    remove(@Param('id') id: string, @Req() req) {
        return this.cattleService.remove(id, req.user as User);
    }
}
