import { Repository } from 'typeorm';
import { HerdBook } from '../../entities/herd-book.entity';
import { CreateHerdBookDto, UpdateHerdBookDto } from './dto/create-herd-book.dto';
export declare class HerdBooksService {
    private herdBooksRepository;
    constructor(herdBooksRepository: Repository<HerdBook>);
    findAll(query?: any): Promise<{
        data: HerdBook[];
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string): Promise<HerdBook>;
    create(createHerdBookDto: CreateHerdBookDto): Promise<HerdBook>;
    update(id: string, updateHerdBookDto: UpdateHerdBookDto): Promise<HerdBook>;
    remove(id: string): Promise<void>;
}
