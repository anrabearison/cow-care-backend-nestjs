import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    Req,
    HttpStatus,
    BadRequestException,
    StreamableFile,
    Header,
} from '@nestjs/common';
import { PassportService } from './passport.service';
import { CreatePassportDto } from './dto/create-passport.dto';
import { UpdatePassportDto } from './dto/update-passport.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { Request } from 'express';

@Controller('passport')
@UseGuards(JwtAuthGuard)
export class PassportController {
    constructor(private readonly passportService: PassportService) {}

    @Post()
    create(@Body() createPassportDto: CreatePassportDto, @Req() req: Request) {
        // Handle cattleIds if it's sent as JSON string
        let cattleIds = createPassportDto.cattleIds;
        if (typeof cattleIds === 'string') {
            try {
                cattleIds = JSON.parse(cattleIds);
            } catch (e) {
                throw new BadRequestException('Invalid cattleIds format');
            }
        }
        return this.passportService.create(createPassportDto, cattleIds, (req as any).user?.id);
    }

    @Get()
    findAll(
        @Query('herdBookId') herdBookId?: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.passportService.findAll(
            herdBookId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10
        );
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
    generatePdf(@Param('id') id: string, @Req() req: Request) {
        const userId = (req as any).user?.id;
        // Capture IP et User-Agent pour l'audit
        const ipAddress =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            req.socket?.remoteAddress ||
            '';
        const userAgent = req.headers['user-agent'] || '';

        return this.passportService.generatePdf(id, userId, ipAddress, userAgent);
    }

    @Get(':id/download')
    @Header('Content-Type', 'application/pdf')
    async downloadPdf(@Param('id') id: string, @Req() req: Request): Promise<StreamableFile> {
        const pdfBuffer = await this.passportService.downloadPdf(id);
        const passport = await this.passportService.findOne(id);

        return new StreamableFile(pdfBuffer, {
            type: 'application/pdf',
            disposition: `attachment; filename="passport-${passport.passportNumber}.pdf"`,
            length: pdfBuffer.length,
        });
    }

    @Delete(':id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER_ADMIN)
    delete(@Param('id') id: string) {
        return this.passportService.delete(id);
    }
}
