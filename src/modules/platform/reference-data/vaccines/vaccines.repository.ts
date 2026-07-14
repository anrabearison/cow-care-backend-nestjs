import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vaccine } from './vaccines.entity';

@Injectable()
export class VaccinesRepository {
  constructor(
    @InjectRepository(Vaccine)
    private readonly repository: Repository<Vaccine>,
  ) {}

  async findAll(query: any = {}) {
    const { page = 1, limit = 10, search } = query;
    
    const queryBuilder = this.repository.createQueryBuilder('vaccine');
    
    if (search) {
      queryBuilder.where('vaccine.name ILIKE :search', { search: `%${search}%` });
    }
    
    queryBuilder.orderBy('vaccine.name', 'ASC');
    
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

  async findOne(id: string): Promise<Vaccine> {
    return this.repository.findOne({ where: { id } });
  }

  async create(vaccine: Partial<Vaccine>): Promise<Vaccine> {
    const newVaccine = this.repository.create(vaccine);
    return this.repository.save(newVaccine);
  }

  async update(id: string, vaccine: Partial<Vaccine>): Promise<Vaccine> {
    await this.repository.update(id, vaccine);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
