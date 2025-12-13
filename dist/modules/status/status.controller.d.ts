import { StatusService } from './status.service';
import { CreateStatusDto, UpdateStatusDto } from './dto/create-status.dto';
import { Response } from 'express';
export declare class StatusController {
    private readonly statusService;
    constructor(statusService: StatusService);
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    findOne(id: string): Promise<import("../../entities/status.entity").Status>;
    create(createStatusDto: CreateStatusDto): Promise<import("../../entities/status.entity").Status>;
    update(id: string, updateStatusDto: UpdateStatusDto): Promise<import("../../entities/status.entity").Status>;
    remove(id: string): Promise<void>;
}
