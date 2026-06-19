import { Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CategoriesMapper } from './categories.mapper';
import { Category } from '../../entities/category.entity';
import * as crypto from 'crypto';

@Injectable()
export class CategoriesService {
    constructor(
        private readonly categoriesRepository: CategoriesRepository,
    ) { }

    async findAll(query: any) {
        const result = await this.categoriesRepository.findAllWithRelations(query, query);

        return {
            ...result,
            data: CategoriesMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string) {
        const category = await this.categoriesRepository.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        return CategoriesMapper.toResponse(category);
    }

    async create(createDto: any) {
        const category = this.categoriesRepository.create({
            id: crypto.randomUUID(),
            ...createDto,
        } as any) as unknown as Category;

        await this.categoriesRepository.save(category);
        return this.findOne(category.id);
    }

    async update(id: string, updateDto: any) {
        const category = await this.categoriesRepository.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }

        Object.assign(category, updateDto);
        await this.categoriesRepository.save(category);
        return this.findOne(id);
    }

    async remove(id: string) {
        const category = await this.categoriesRepository.findOne({ where: { id } });
        if (!category) {
            throw new NotFoundException(`Category with ID ${id} not found`);
        }
        const response = CategoriesMapper.toResponse(category);
        await this.categoriesRepository.remove(category);
        return response;
    }
}
