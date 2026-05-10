import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Category } from '../../entities/category.entity';

@Injectable()
export class CategoriesRepository extends Repository<Category> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Category, dataSource.createEntityManager());
    }

    async findAllWithRelations(): Promise<Category[]> {
        return this.find();
    }

    async findOneWithRelations(id: string): Promise<Category | null> {
        return this.findOne({ where: { id } });
    }
}
