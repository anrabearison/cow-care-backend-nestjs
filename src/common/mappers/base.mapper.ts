export interface IMapper<Entity, ResponseDto> {
    toResponse(entity: Entity): ResponseDto;
    toResponseList(entities: Entity[]): ResponseDto[];
}

export abstract class BaseMapper {
    static mapList<E, R>(entities: E[], mapFn: (e: E) => R): R[] {
        if (!entities) return [];
        return entities.map(mapFn);
    }
}
