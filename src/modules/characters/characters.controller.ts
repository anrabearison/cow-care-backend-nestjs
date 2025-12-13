import { Controller, Get, Post, Body, Put, Param, Delete, Res } from '@nestjs/common';
import { CharactersService } from './characters.service';
import { CreateCharacterDto, UpdateCharacterDto } from './dto/create-character.dto';
import { Response } from 'express';

@Controller('api/v1/characters')
export class CharactersController {
    constructor(private readonly charactersService: CharactersService) { }

    @Get()
    async findAll(@Res() res: Response) {
        const characters = await this.charactersService.findAll();
        res.set('X-Total-Count', characters.length.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return res.json(characters);
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
