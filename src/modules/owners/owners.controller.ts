import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Res, Req } from '@nestjs/common';
import { Response } from 'express';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../../entities/user.entity';

@ApiTags('owners')
@ApiBearerAuth()
@Controller('owners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OwnersController {
    constructor(private readonly ownersService: OwnersService) { }

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER_ADMIN, UserRole.OWNER_USER)
    @ApiOperation({ summary: 'Get paginated list of owners' })
    async findAll(@Query() query, @Res({ passthrough: true }) res: Response) {
        const result = await this.ownersService.findAll(query);

        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');

        return result;
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER_ADMIN, UserRole.OWNER_USER)
    @ApiOperation({ summary: 'Get a specific owner' })
    findOne(@Param('id') id: string) {
        return this.ownersService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new owner' })
    create(@Body() createOwnerDto: CreateOwnerDto) {
        return this.ownersService.create(createOwnerDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an owner' })
    update(@Param('id') id: string, @Body() updateOwnerDto: any) {
        return this.ownersService.update(id, updateOwnerDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an owner' })
    remove(@Param('id') id: string) {
        return this.ownersService.remove(id);
    }
}
