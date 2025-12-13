import { CharactersService } from './characters.service';
import { CreateCharacterDto, UpdateCharacterDto } from './dto/create-character.dto';
import { Response } from 'express';
export declare class CharactersController {
    private readonly charactersService;
    constructor(charactersService: CharactersService);
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    findOne(id: string): Promise<import("../../entities/character.entity").Character>;
    create(createCharacterDto: CreateCharacterDto): Promise<import("../../entities/character.entity").Character>;
    update(id: string, updateCharacterDto: UpdateCharacterDto): Promise<import("../../entities/character.entity").Character>;
    remove(id: string): Promise<void>;
}
