import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportsService } from './exports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Farm - Exports')
@ApiBearerAuth()
@Controller('farm/exports')
@UseGuards(JwtAuthGuard)
export class ExportsController {
    constructor(private readonly exportsService: ExportsService) { }

    @Get('excel')
    @ApiOperation({ summary: 'Export data to Excel' })
    async exportExcel(@Query('type') type: string, @Res() res: Response) {
        // Logic to fetch data based on type (cattle, treatments, etc.)
        // For now, just a placeholder
        const data = [];
        const columns = [];
        return this.exportsService.exportToExcel(data, columns, res);
    }

    @Get('pdf')
    @ApiOperation({ summary: 'Export data to PDF' })
    async exportPdf(@Query('type') type: string, @Res() res: Response) {
        const data = [];
        return this.exportsService.exportToPdf(data, res);
    }
}
