import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto } from './dto/create-veterinarian.dto';
import { UpdateVeterinarianDto } from './dto/update-veterinarian.dto';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('veterinarians')
@ApiBearerAuth()
@Controller('veterinarians')
@UseGuards(JwtAuthGuard)
export class VeterinariansController {
    constructor(private readonly veterinariansService: VeterinariansService) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of veterinarians' })
    async findAll(@Query() query, @Req() req) {
        return await this.veterinariansService.findAll(query, req.user as User);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific veterinarian' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.veterinariansService.findOne(id, req.user as User);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new veterinarian' })
    create(@Body() createVeterinarianDto: CreateVeterinarianDto, @Req() req) {
        return this.veterinariansService.create(createVeterinarianDto, req.user as User);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a veterinarian' })
    update(@Param('id') id: string, @Body() updateVeterinarianDto: UpdateVeterinarianDto, @Req() req) {
        return this.veterinariansService.update(id, updateVeterinarianDto, req.user as User);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a veterinarian' })
    remove(@Param('id') id: string, @Req() req) {
        return this.veterinariansService.remove(id, req.user as User);
    }
}
