import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from '../../../categories/dto/create-category.dto';
import { UpdateCategoryDto } from '../../../categories/dto/update-category.dto';
import { CategoriesRepository } from '../../../categories/categories.repository';
import { CategoriesMapper } from '../../../categories/categories.mapper';
import * as crypto from 'crypto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

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

  async create(createCategoryDto: CreateCategoryDto) {
    const category = this.categoriesRepository.create({
      id: crypto.randomUUID(),
      ...createCategoryDto,
    } as any) as any;

    await this.categoriesRepository.save(category);
    return this.findOne(category.id);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoriesRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    Object.assign(category, updateCategoryDto);
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
