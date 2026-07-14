import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Breed } from './breeds.entity';

@Injectable()
export class BreedsRepository {
  constructor(
    @InjectRepository(Breed)
    private readonly repository: Repository<Breed>,
  ) {}

  async findAll(query: any = {}) {
    const { page = 1, limit = 10, search } = query;
    
    const queryBuilder = this.repository.createQueryBuilder('breed');
    
    if (search) {
      queryBuilder.where('breed.name ILIKE :search', { search: `%${search}%` });
    }
    
    queryBuilder.orderBy('breed.name', 'ASC');
    
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

  async findOne(id: string): Promise<Breed> {
    return this.repository.findOne({ where: { id } });
  }

  async create(breed: Partial<Breed>): Promise<Breed> {
    const newBreed = this.repository.create(breed);
    return this.repository.save(newBreed);
  }

  async update(id: string, breed: Partial<Breed>): Promise<Breed> {
    await this.repository.update(id, breed);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
