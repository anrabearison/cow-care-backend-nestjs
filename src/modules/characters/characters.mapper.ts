import { BaseMapper } from '../../common/mappers/base.mapper';
import { Character } from '../../entities/character.entity';

export class CharactersMapper extends BaseMapper {
    static toResponse(character: Character) {
        if (!character) return null;
        return {
            id: character.id,
            name: character.name,
            createdAt: character.createdAt,
            updatedAt: character.updatedAt,
        };
    }

    static toResponseList(entities: Character[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}
