import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Status } from '../../entities/status.entity';

@Injectable()
export class StatusRepository extends Repository<Status> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Status, dataSource.createEntityManager());
    }

    async findAllWithRelations(): Promise<Status[]> {
        return this.find();
    }

    async findOneWithRelations(id: string): Promise<Status | null> {
        return this.findOne({ where: { id } });
    }
}
