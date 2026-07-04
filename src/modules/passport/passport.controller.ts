import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { PassportService } from './passport.service';
import { CreatePassportDto } from './dto/create-passport.dto';
import { UpdatePassportDto } from './dto/update-passport.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('passport')
@UseGuards(JwtAuthGuard)
export class PassportController {
    constructor(private readonly passportService: PassportService) {}

    @Post()
    create(@Body() createPassportDto: CreatePassportDto, @Req() req) {
        // Handle cattleIds if it's sent as JSON string
        let cattleIds = createPassportDto.cattleIds;
        if (typeof cattleIds === 'string') {
            try {
                cattleIds = JSON.parse(cattleIds);
            } catch (e) {
                throw new BadRequestException('Invalid cattleIds format');
            }
        }
        return this.passportService.create(createPassportDto, cattleIds, req.user?.id);
    }

    @Get()
    findAll(@Query('herdBookId') herdBookId?: string) {
        return this.passportService.findAll(herdBookId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.passportService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updatePassportDto: UpdatePassportDto) {
        return this.passportService.update(id, updatePassportDto);
    }

    @Post(':id/generate')
    generatePdf(@Param('id') id: string, @Req() req) {
        return this.passportService.generatePdf(id, req.user?.id);
    }

    @Get(':id/download')
    async downloadPdf(@Param('id') id: string, @Res() res: Response) {
        try {
            const pdfBuffer = await this.passportService.downloadPdf(id);
            res.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=passport-${id}.pdf`,
                'Content-Length': pdfBuffer.length,
            });
            res.send(pdfBuffer);
        } catch (error) {
            res.status(HttpStatus.NOT_FOUND).json({ message: error.message });
        }
    }

    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.passportService.delete(id);
    }
}
