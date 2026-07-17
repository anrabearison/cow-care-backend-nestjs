import {Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, Request} from '@nestjs/common';
import {OwnersService} from './owners.service';
import {CreateOwnerDto} from './dto/create-owner.dto';
import {JwtAuthGuard} from '../../auth/guards/jwt-auth.guard';
import {ApiBearerAuth, ApiOperation, ApiTags} from '@nestjs/swagger';
import {Roles} from '../../auth/decorators/roles.decorator';
import {RolesGuard} from '../../auth/guards/roles.guard';
import {UserRole} from '../../platform/users/entities/user.entity';

@ApiTags('owners')
@ApiBearerAuth()
@Controller('owners')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OwnersController {
    constructor(private readonly ownersService: OwnersService) { }

    @Get()
    @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER_ADMIN, UserRole.OWNER_USER)
    @ApiOperation({ summary: 'Get paginated list of owners' })
    async findAll(@Query() query, @Request() req) {
        return await this.ownersService.findAll(query, req.user);
    }

    @Get(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER_ADMIN, UserRole.OWNER_USER)
    @ApiOperation({ summary: 'Get a specific owner' })
    findOne(@Param('id') id: string, @Request() req) {
        return this.ownersService.findOne(id, req.user);
    }

    @Post()
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Create a new owner' })
    create(@Body() createOwnerDto: CreateOwnerDto) {
        return this.ownersService.create(createOwnerDto);
    }

    @Put(':id')
    @Roles(UserRole.SUPER_ADMIN, UserRole.OWNER_ADMIN)
    @ApiOperation({ summary: 'Update an owner' })
    update(@Param('id') id: string, @Body() updateOwnerDto: any, @Request() req) {
        return this.ownersService.update(id, updateOwnerDto, req.user);
    }

    @Delete(':id')
    @Roles(UserRole.SUPER_ADMIN)
    @ApiOperation({ summary: 'Delete an owner' })
    remove(@Param('id') id: string) {
        return this.ownersService.remove(id);
    }
}
