import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatusService } from './status.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Farm - Status')
@Controller('farm/status')
@UseGuards(JwtAuthGuard)
export class StatusController {
    constructor(private readonly statusService: StatusService) { }

    @Get()
    @ApiOperation({ summary: 'List all status (read-only)' })
    async findAll(@Query() query: any) {
        return await this.statusService.findAll(query || {});
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a status by ID (read-only)' })
    findOne(@Param('id') id: string) {
        return this.statusService.findOne(id);
    }
}
