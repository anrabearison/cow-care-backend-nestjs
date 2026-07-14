import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Disease } from './diseases.entity';

@Injectable()
export class DiseasesRepository {
  constructor(
    @InjectRepository(Disease)
    private readonly repository: Repository<Disease>,
  ) {}

  async findAll(query: any = {}) {
    const { page = 1, limit = 10, search } = query;
    
    const queryBuilder = this.repository.createQueryBuilder('disease');
    
    if (search) {
      queryBuilder.where('disease.name ILIKE :search', { search: `%${search}%` });
    }
    
    queryBuilder.orderBy('disease.name', 'ASC');
    
    if (page && limit) {
      queryBuilder.skip((page - 1) * limit).take(limit);
    }
    
    const [items, total] = await queryBuilder.getManyAndCount();
    
    return {
      items,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Disease> {
    return this.repository.findOne({ where: { id } });
  }

  async create(disease: Partial<Disease>): Promise<Disease> {
    const newDisease = this.repository.create(disease);
    return this.repository.save(newDisease);
  }

  async update(id: string, disease: Partial<Disease>): Promise<Disease> {
    await this.repository.update(id, disease);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
