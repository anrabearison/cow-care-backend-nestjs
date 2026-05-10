import { Injectable, NotFoundException } from '@nestjs/common';
import { StatusRepository } from './status.repository';
import { StatusMapper } from './status.mapper';
import { Status } from '../../entities/status.entity';
import * as crypto from 'crypto';

@Injectable()
export class StatusService {
    constructor(
        private readonly statusRepository: StatusRepository,
    ) { }

    async findAll(query: any) {
        const result = await this.statusRepository.findAllWithRelations(query, query);

        return {
            ...result,
            data: StatusMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string) {
        const status = await this.statusRepository.findOne({ where: { id } });
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }
        return StatusMapper.toResponse(status);
    }

    async create(createDto: any) {
        const status = this.statusRepository.create({
            id: crypto.randomUUID(),
            ...createDto,
        } as any) as unknown as Status;

        await this.statusRepository.save(status);
        return this.findOne(status.id);
    }

    async update(id: string, updateDto: any) {
        const status = await this.statusRepository.findOne({ where: { id } });
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }

        Object.assign(status, updateDto);
        await this.statusRepository.save(status);
        return this.findOne(id);
    }

    async remove(id: string) {
        const status = await this.statusRepository.findOne({ where: { id } });
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }
        const response = StatusMapper.toResponse(status);
        await this.statusRepository.remove(status);
        return response;
    }
}
