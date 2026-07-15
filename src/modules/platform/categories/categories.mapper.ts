import { BaseMapper } from '../../common/mappers/base.mapper';
import { Category } from './entities/category.entity';

export class CategoriesMapper extends BaseMapper {
    static toResponse(category: Category) {
        if (!category) return null;
        return {
            id: category.id,
            name: category.name,
            createdAt: category.createdAt,
            updatedAt: category.updatedAt,
        };
    }

    static toResponseList(entities: Category[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}
