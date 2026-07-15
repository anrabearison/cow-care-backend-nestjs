import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../rbac/guards/permissions.guard';
import { RequirePermissions } from '../../../rbac/decorators/require-permissions.decorator';
import { PlatformPermissions } from '../../../rbac/constants/permissions.constant';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from '../../../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../../../categories/dto/update-category.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Platform - Reference Data - Categories')
@Controller('platform/reference-data/categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  async findAll(@Query() query: any) {
    return await this.categoriesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_READ)
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Create a new category' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoriesService.create(createCategoryDto);
  }

  @Put(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Update a category' })
  update(@Param('id') id: string, @Body() updateCategoryDto: UpdateCategoryDto) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @RequirePermissions(PlatformPermissions.PLATFORM_REFERENCE_WRITE)
  @ApiOperation({ summary: 'Delete a category' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
