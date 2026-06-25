import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { UpdateTreatmentDto } from './dto/update-treatment.dto';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('treatments')
@ApiBearerAuth()
@Controller('treatments')
@UseGuards(JwtAuthGuard)
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
    @ApiOperation({ summary: 'Create a new treatment' })
    create(@Body() createTreatmentDto: CreateTreatmentDto, @Req() req) {
        return this.treatmentsService.create(createTreatmentDto, req.user as User);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a treatment' })
    update(@Param('id') id: string, @Body() updateTreatmentDto: UpdateTreatmentDto, @Req() req) {
        return this.treatmentsService.update(id, updateTreatmentDto, req.user as User);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a treatment' })
    remove(@Param('id') id: string, @Req() req) {
        return this.treatmentsService.remove(id, req.user as User);
    }
}
