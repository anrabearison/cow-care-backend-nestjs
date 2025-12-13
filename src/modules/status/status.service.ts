import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from '../../entities/status.entity';
import { CreateStatusDto, UpdateStatusDto } from './dto/create-status.dto';

@Injectable()
export class StatusService {
    constructor(
        @InjectRepository(Status)
        private statusRepository: Repository<Status>,
    ) { }

    async findAll(): Promise<Status[]> {
        return this.statusRepository.find();
    }

    async findOne(id: string): Promise<Status> {
        const status = await this.statusRepository.findOne({ where: { id } });
        if (!status) {
            throw new NotFoundException(`Status with ID ${id} not found`);
        }
        return status;
    }

    async create(createStatusDto: CreateStatusDto): Promise<Status> {
        const status = this.statusRepository.create(createStatusDto);
        return this.statusRepository.save(status);
    }

    async update(id: string, updateStatusDto: UpdateStatusDto): Promise<Status> {
        const status = await this.findOne(id);
        Object.assign(status, updateStatusDto);
        return this.statusRepository.save(status);
    }

    async remove(id: string): Promise<void> {
        const status = await this.findOne(id);
        await this.statusRepository.remove(status);
    }
}
