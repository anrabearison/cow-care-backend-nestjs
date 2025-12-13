import { Repository } from 'typeorm';
import { Status } from '../../entities/status.entity';
import { CreateStatusDto, UpdateStatusDto } from './dto/create-status.dto';
export declare class StatusService {
    private statusRepository;
    constructor(statusRepository: Repository<Status>);
    findAll(): Promise<Status[]>;
    findOne(id: string): Promise<Status>;
    create(createStatusDto: CreateStatusDto): Promise<Status>;
    update(id: string, updateStatusDto: UpdateStatusDto): Promise<Status>;
    remove(id: string): Promise<void>;
}
