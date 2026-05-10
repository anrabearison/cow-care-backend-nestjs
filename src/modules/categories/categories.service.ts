import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';
import { CategoriesRepository } from './categories.repository';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';

@Injectable()
export class CategoriesService {
    constructor(
        private readonly categoriesRepository: CategoriesRepository,
    ) { }

    async findAll() {
        const rawData = await this.categoriesRepository.findAllWithRelations();
        return transformKeysToSnakeCase(rawData);
    }

    async findOne(id: string) {
        const category = await this.categoriesRepository.findOneWithRelations(id);
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return transformKeysToSnakeCase(category);
    }

    async create(createCategoryDto: CreateCategoryDto) {
        const category = this.categoriesRepository.create(createCategoryDto);
        const saved = await this.categoriesRepository.save(category);
        return transformKeysToSnakeCase(saved);
    }

    async update(id: string, updateCategoryDto: UpdateCategoryDto) {
        const category = await this.categoriesRepository.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        Object.assign(category, updateCategoryDto);
        const saved = await this.categoriesRepository.save(category);
        return transformKeysToSnakeCase(saved);
    }

    async remove(id: string) {
        const category = await this.categoriesRepository.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        await this.categoriesRepository.remove(category);
        return transformKeysToSnakeCase(category);
    }
}
