import { Controller, Get, Post, Body, Put, Param, Delete, Res, Query } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto, UpdateCharacterDto } from './dto/create-character.dto';
import { Response } from 'express';

@Controller('characters')
export class CharactersController {
    constructor(private readonly charactersService: CharactersService) { }

    @Get()
    async findAll(@Query() query: any, @Res({ passthrough: true }) res: Response) {
        const result = await this.charactersService.findAll(query || {});
        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return result.data;
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
