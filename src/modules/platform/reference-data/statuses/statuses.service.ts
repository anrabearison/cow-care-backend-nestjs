import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateStatusDto } from '../../../status/dto/create-status.dto';
import { UpdateStatusDto } from '../../../status/dto/update-status.dto';
import { StatusRepository } from '../../../status/status.repository';
import { StatusMapper } from '../../../status/status.mapper';
import * as crypto from 'crypto';

@Injectable()
export class StatusesService {
  constructor(private readonly statusRepository: StatusRepository) {}

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

  async create(createStatusDto: CreateStatusDto) {
    const status = this.statusRepository.create({
      id: crypto.randomUUID(),
      ...createStatusDto,
    } as any) as any;

    await this.statusRepository.save(status);
    return this.findOne(status.id);
  }

  async update(id: string, updateStatusDto: UpdateStatusDto) {
    const status = await this.statusRepository.findOne({ where: { id } });
    if (!status) {
      throw new NotFoundException(`Status with ID ${id} not found`);
    }

    Object.assign(status, updateStatusDto);
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
