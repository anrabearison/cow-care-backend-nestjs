import { Repository } from 'typeorm';
import { Owner } from '../../entities/owner.entity';
import { CreateOwnerDto } from './dto/create-owner.dto';
export declare class OwnersService {
    private ownersRepository;
    constructor(ownersRepository: Repository<Owner>);
    findAll(query: any, user?: any): Promise<{
        data: any;
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string): Promise<Owner>;
    create(createOwnerDto: CreateOwnerDto): Promise<Owner>;
    update(id: string, updateOwnerDto: any): Promise<Owner>;
    remove(id: string): Promise<Owner>;
}
