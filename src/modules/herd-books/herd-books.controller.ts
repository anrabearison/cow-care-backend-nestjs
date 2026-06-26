import { Controller, Get, Post, Body, Put, Param, Delete, Req } from '@nestjs/common';
import { HerdBooksService } from './herd-books.service';
import { CreateHerdBookDto } from './dto/create-herd-book.dto';
import { UpdateHerdBookDto } from './dto/update-herd-book.dto';
import { UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, AllRoles } from '../auth/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';

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
}
