import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Controller('characters')
export class CharactersController {
    constructor(private readonly charactersService: CharactersService) { }

    @Get()
    async findAll(@Query() query: any) {
        return await this.charactersService.findAll(query || {});
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.charactersService.findOne(id);
    }

    @Post()
    create(@Body() createCharacterDto: CreateCharacterDto) {
        return this.charactersService.create(createCharacterDto);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateCharacterDto: UpdateCharacterDto) {
        return this.charactersService.update(id, updateCharacterDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.charactersService.remove(id);
    }
}
