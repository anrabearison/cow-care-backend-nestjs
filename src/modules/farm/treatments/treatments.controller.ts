import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { User } from '../../platform/users/entities/user.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../platform/users/entities/user.entity';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';

@ApiTags('treatments')
@ApiBearerAuth()
@Controller('treatments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.OWNER_ADMIN, UserRole.OWNER_USER)
export class TreatmentsController {
    constructor(private readonly treatmentsService: TreatmentsService) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of treatments' })
    async findAll(@Query() query, @Req() req) {
        return await this.treatmentsService.findAll(query, req.user as User);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific treatment' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.treatmentsService.findOne(id, req.user as User);
    }

    @Post()
    @Throttle({ default: { limit: 50, ttl: 3600000 } }) // 50 traitements/heure par utilisateur
    @ApiOperation({ summary: 'Create a new treatment' })
    @ApiResponse({ status: 429, description: 'Too many insertions, please try again later' })
    create(@Body() createTreatmentDto: CreateTreatmentDto, @Req() req) {
        return this.treatmentsService.create(createTreatmentDto, req.user as User);
    }

    @Put(':id')
    @Throttle({ default: { limit: 100, ttl: 3600000 } }) // 100 mises à jour/heure par utilisateur
    @ApiOperation({ summary: 'Update a treatment' })
    @ApiResponse({ status: 429, description: 'Too many updates, please try again later' })
    update(@Param('id') id: string, @Body() updateTreatmentDto: UpdateTreatmentDto, @Req() req) {
        return this.treatmentsService.update(id, updateTreatmentDto, req.user as User);
    }

    @Delete(':id')
    @Throttle({ default: { limit: 30, ttl: 3600000 } }) // 30 suppressions/heure par utilisateur
    @ApiOperation({ summary: 'Delete a treatment' })
    @ApiResponse({ status: 429, description: 'Too many deletions, please try again later' })
    remove(@Param('id') id: string, @Req() req) {
        return this.treatmentsService.remove(id, req.user as User);
    }
}
