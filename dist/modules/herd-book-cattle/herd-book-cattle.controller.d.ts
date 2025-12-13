import { HerdBookCattleService } from './herd-book-cattle.service';
import { CreateHerdBookCattleDto } from './dto/create-herd-book-cattle.dto';
import { UpdateHerdBookCattleDto } from './dto/update-herd-book-cattle.dto';
import { Request, Response } from 'express';
export declare class HerdBookCattleController {
    private readonly service;
    constructor(service: HerdBookCattleService);
    findAll(query: any, req: Request, res: Response): Promise<void>;
    findOne(id: string): Promise<any>;
    create(dto: CreateHerdBookCattleDto): Promise<any>;
    update(id: string, dto: UpdateHerdBookCattleDto): Promise<any>;
    remove(id: string, res: Response): Promise<void>;
}
