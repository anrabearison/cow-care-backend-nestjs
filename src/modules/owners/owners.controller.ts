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
@Controller('api/v1/owners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OwnersController {
    constructor(private readonly ownersService: OwnersService) { }

    @Get()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get paginated list of owners' })
    async findAll(@Query() query, @Res() res: Response, @Req() req) {
        const result = await this.ownersService.findAll(query, req.user);

        res.set('Content-Range', `owners ${(result.page - 1) * result.per_page}-${(result.page - 1) * result.per_page + result.data.length}/${result.total}`);
        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');

        res.json(result);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific owner' })
    findOne(@Param('id') id: string, @Req() req) {
        return this.ownersService.findOne(id, req.user);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new owner' })
    create(@Body() createOwnerDto: CreateOwnerDto) {
        return this.ownersService.create(createOwnerDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an owner' })
    update(@Param('id') id: string, @Body() updateOwnerDto: any, @Req() req) {
        return this.ownersService.update(id, updateOwnerDto, req.user);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an owner' })
    remove(@Param('id') id: string, @Req() req) {
        return this.ownersService.remove(id, req.user);
    }
}
