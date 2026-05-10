import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStatusDto, UpdateStatusDto } from './dto/create-status.dto';
import { StatusRepository } from './status.repository';
import { transformKeysToSnakeCase } from '../../common/utils/case-transform.util';

@Injectable()
export class StatusService {
    constructor(
        private readonly statusRepository: StatusRepository,
    ) { }

    async findAll() {
        const rawData = await this.statusRepository.findAllWithRelations();
        return transformKeysToSnakeCase(rawData);
    }

    async findOne(id: string) {
        const status = await this.statusRepository.findOneWithRelations(id);
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }
        return transformKeysToSnakeCase(status);
    }

    async create(createStatusDto: CreateStatusDto) {
        const status = this.statusRepository.create(createStatusDto);
        const saved = await this.statusRepository.save(status);
        return transformKeysToSnakeCase(saved);
    }

    async update(id: string, updateStatusDto: UpdateStatusDto) {
        const status = await this.statusRepository.findOne({ where: { id } });
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }
        Object.assign(status, updateStatusDto);
        const saved = await this.statusRepository.save(status);
        return transformKeysToSnakeCase(saved);
    }

    async remove(id: string) {
        const status = await this.statusRepository.findOne({ where: { id } });
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }
        await this.statusRepository.remove(status);
        return transformKeysToSnakeCase(status);
    }
}
