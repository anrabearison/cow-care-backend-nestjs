import { Controller, Get, Post, Body, Put, Param, Delete, Req, Query, UseGuards, UseInterceptors, UploadedFile, Res, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { HerdBooksService } from './herd-books.service';
import { CreateHerdBookDto } from './dto/create-herd-book.dto';
import { UpdateHerdBookDto } from './dto/update-herd-book.dto';
import { InitialImportHerdBookDto } from './dto/initial-import-herd-book.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { AllRoles, Roles } from '../../auth/decorators/roles.decorator';
import { User, UserRole } from '../../platform/users/entities/user.entity';

@Controller('herd-books')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HerdBooksController {
    constructor(private readonly herdBooksService: HerdBooksService) { }

    @Get()
    @AllRoles()
    async findAll(@Query() query, @Req() req) {
        // Default sort to year DESC
        if (!query.sort) {
            query.sort = 'year';
            query.order = 'DESC';
        }
        return await this.herdBooksService.findAll(query, req.user as User);
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req) {
        return this.herdBooksService.findOne(id, req.user as User);
    }

    @Post()
    create(@Body() createHerdBookDto: CreateHerdBookDto, @Query('owner_id') ownerId: string, @Req() req) {
        // If owner_id is provided in query, use it; otherwise use from DTO
        if (ownerId) {
            createHerdBookDto.ownerId = ownerId;
        }
        return this.herdBooksService.create(createHerdBookDto, req.user as User);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateHerdBookDto: UpdateHerdBookDto, @Req() req) {
        return this.herdBooksService.update(id, updateHerdBookDto, req.user as User);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Req() req) {
        return this.herdBooksService.remove(id, req.user as User);
    }

    @Post('initial-import/dry-run')
    @Roles(UserRole.OWNER_ADMIN)
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
    async dryRunInitialImport(
        @Body() herdBookDto: InitialImportHerdBookDto,
        @UploadedFile() file: Express.Multer.File,
        @Req() req,
    ) {
        return await this.herdBooksService.dryRunInitialImport(herdBookDto, file, req.user as User);
    }

    @Post('initial-import/confirm')
    @Roles(UserRole.OWNER_ADMIN)
    @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
    async confirmInitialImport(
        @Body() herdBookDto: InitialImportHerdBookDto,
        @UploadedFile() file: Express.Multer.File,
        @Req() req,
    ) {
        return await this.herdBooksService.confirmInitialImport(herdBookDto, file, req.user as User);
    }

    @Get('initial-import/template')
    @Roles(UserRole.OWNER_ADMIN)
    async generateCsvTemplate(@Res() res: Response) {
        const buffer = await this.herdBooksService.generateCsvTemplate();
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=herdbook-import-template.csv');
        res.status(HttpStatus.OK).send(buffer);
    }
}
