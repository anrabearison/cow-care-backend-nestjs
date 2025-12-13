import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { TreatmentsService } from './treatments.service';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('treatments')
@ApiBearerAuth()
@Controller('api/v1/treatments')
@UseGuards(JwtAuthGuard)
export class TreatmentsController {
    constructor(private readonly treatmentsService: TreatmentsService) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of treatments' })
    async findAll(@Query() query, @Res() res: Response, @Req() req) {
        const result = await this.treatmentsService.findAll(query, req.user);

        res.set('Content-Range', `treatments ${(result.page - 1) * result.per_page}-${(result.page - 1) * result.per_page + result.data.length}/${result.total}`);
        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');

        res.json(result.data);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific treatment' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.treatmentsService.findOne(id, req.user);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new treatment' })
    create(@Body() createTreatmentDto: CreateTreatmentDto, @Req() req) {
        return this.treatmentsService.create(createTreatmentDto, req.user);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a treatment' })
    update(@Param('id') id: string, @Body() updateTreatmentDto: any, @Req() req) {
        return this.treatmentsService.update(id, updateTreatmentDto, req.user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a treatment' })
    remove(@Param('id') id: string, @Req() req) {
        return this.treatmentsService.remove(id, req.user);
    }
}
