import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CategoriesService } from './categories.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Farm - Categories')
@Controller('farm/categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @ApiOperation({ summary: 'List all categories (read-only)' })
    async findAll(@Query() query: any) {
        return await this.categoriesService.findAll(query || {});
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a category by ID (read-only)' })
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }
}
