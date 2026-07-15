import {Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards} from '@nestjs/common';
import {OwnersService} from './owners.service';
import {CreateOwnerDto} from './dto/create-owner.dto';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {ApiBearerAuth, ApiOperation, ApiTags} from '@nestjs/swagger';
import {AllRoles} from '../auth/decorators/roles.decorator';
import {RolesGuard} from '../auth/guards/roles.guard';

@ApiTags('Farm - Owners')
@ApiBearerAuth()
@Controller('farm/owners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OwnersController {
    constructor(private readonly ownersService: OwnersService) { }

    @Get()
    @AllRoles()
    @ApiOperation({ summary: 'Get paginated list of owners' })
    async findAll(@Query() query) {
        return await this.ownersService.findAll(query);
    }

    @Get(':id')
    @AllRoles()
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
