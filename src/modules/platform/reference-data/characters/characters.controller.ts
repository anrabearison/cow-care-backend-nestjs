import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../rbac/guards/permissions.guard';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { PlatformPermissions } from '../../../rbac/constants/permissions.constant';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from '../../../characters/dto/create-character.dto';
import { UpdateCharacterDto } from '../../../characters/dto/update-character.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Platform - Reference Data - Characters')
@Controller('platform/reference-data/characters')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  async findAll(@Query() query: any) {
    return await this.charactersService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }

  @Post()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Create a new character' })
  create(@Body() createCharacterDto: CreateCharacterDto) {
    return this.charactersService.create(createCharacterDto);
  }

  @Put(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Update a character' })
  update(@Param('id') id: string, @Body() updateCharacterDto: UpdateCharacterDto) {
    return this.charactersService.update(id, updateCharacterDto);
  }

  @Delete(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Delete a character' })
  remove(@Param('id') id: string) {
    return this.charactersService.remove(id);
  }
}
