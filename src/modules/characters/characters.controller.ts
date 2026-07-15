import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CharactersService } from './characters.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Farm - Characters')
@Controller('farm/characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
    constructor(private readonly charactersService: CharactersService) { }

    @Get()
    @ApiOperation({ summary: 'List all characters (read-only)' })
    async findAll(@Query() query: any) {
        return await this.charactersService.findAll(query || {});
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get a character by ID (read-only)' })
    findOne(@Param('id') id: string) {
        return this.charactersService.findOne(id);
    }
}
