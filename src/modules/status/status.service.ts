import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStatusDto, UpdateStatusDto } from './dto/create-status.dto';
import { StatusRepository } from './status.repository';

@Injectable()
export class StatusService {
    constructor(
        private readonly statusRepository: StatusRepository,
    ) { }

    async findAll() {
        return this.statusRepository.findAllWithRelations();
    }

    async findOne(id: string) {
        const status = await this.statusRepository.findOneWithRelations(id);
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }
        return status;
    }

    async create(createStatusDto: CreateStatusDto) {
        const status = this.statusRepository.create(createStatusDto);
        return this.statusRepository.save(status);
    }

    async update(id: string, updateStatusDto: UpdateStatusDto) {
        const status = await this.statusRepository.findOne({ where: { id } });
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }
        Object.assign(status, updateStatusDto);
        return this.statusRepository.save(status);
    }

    async remove(id: string) {
        const status = await this.statusRepository.findOne({ where: { id } });
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }
        await this.statusRepository.remove(status);
        return status;
    }
}
