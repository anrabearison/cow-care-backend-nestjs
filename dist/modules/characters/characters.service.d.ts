import { Repository } from 'typeorm';
import { Character } from '../../entities/character.entity';
import { CreateCharacterDto, UpdateCharacterDto } from './dto/create-character.dto';
export declare class CharactersService {
    private charactersRepository;
    constructor(charactersRepository: Repository<Character>);
    findAll(): Promise<Character[]>;
    findOne(id: string): Promise<Character>;
    create(createCharacterDto: CreateCharacterDto): Promise<Character>;
    update(id: string, updateCharacterDto: UpdateCharacterDto): Promise<Character>;
    remove(id: string): Promise<void>;
}
