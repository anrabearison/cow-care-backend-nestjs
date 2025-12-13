import { HerdBooksService } from './herd-books.service';
import { CreateHerdBookDto, UpdateHerdBookDto } from './dto/create-herd-book.dto';
import { Response } from 'express';
export declare class HerdBooksController {
    private readonly herdBooksService;
    constructor(herdBooksService: HerdBooksService);
    findAll(query: any, res: Response): Promise<Response<any, Record<string, any>>>;
    findOne(id: string): Promise<import("../../entities/herd-book.entity").HerdBook>;
    create(createHerdBookDto: CreateHerdBookDto): Promise<import("../../entities/herd-book.entity").HerdBook>;
    update(id: string, updateHerdBookDto: UpdateHerdBookDto): Promise<import("../../entities/herd-book.entity").HerdBook>;
    remove(id: string): Promise<void>;
}
