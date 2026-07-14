import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
    constructor(private readonly organizationsService: OrganizationsService) { }

    @Get()
    @ApiOperation({ summary: 'Get paginated list of organizations' })
    async findAll(@Query() query) {
        return await this.organizationsService.findAll(query);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a specific organization' })
    findOne(@Param('id') id: string) {
        return this.organizationsService.findOne(id);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new organization' })
    create(@Body() createOrganizationDto: CreateOrganizationDto) {
        return this.organizationsService.create(createOrganizationDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an organization' })
    update(@Param('id') id: string, @Body() updateOrganizationDto: UpdateOrganizationDto) {
        return this.organizationsService.update(id, updateOrganizationDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Deactivate an organization (soft delete)' })
    remove(@Param('id') id: string) {
        return this.organizationsService.remove(id);
    }

    @Post(':id/activate')
    @ApiOperation({ summary: 'Activate an organization' })
    activate(@Param('id') id: string) {
        return this.organizationsService.activate(id);
    }

    @Post(':id/deactivate')
    @ApiOperation({ summary: 'Deactivate an organization' })
    deactivate(@Param('id') id: string) {
        return this.organizationsService.deactivate(id);
    }
}
