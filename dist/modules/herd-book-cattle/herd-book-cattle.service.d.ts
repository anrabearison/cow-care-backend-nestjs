import { Repository } from 'typeorm';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { CreateHerdBookCattleDto } from './dto/create-herd-book-cattle.dto';
import { UpdateHerdBookCattleDto } from './dto/update-herd-book-cattle.dto';
export declare class HerdBookCattleService {
    private readonly herdBookCattleRepo;
    constructor(herdBookCattleRepo: Repository<HerdBookCattle>);
    findAll(query: any, user: any): Promise<{
        data: any;
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string): Promise<any>;
    create(dto: CreateHerdBookCattleDto): Promise<any>;
    update(id: string, dto: UpdateHerdBookCattleDto): Promise<any>;
    remove(id: string): Promise<any>;
}
