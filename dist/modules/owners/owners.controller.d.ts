import { Response } from 'express';
import { OwnersService } from './owners.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
export declare class OwnersController {
    private readonly ownersService;
    constructor(ownersService: OwnersService);
    findAll(query: any, res: Response, req: any): Promise<void>;
    findOne(id: string): Promise<import("../../entities/owner.entity").Owner>;
    create(createOwnerDto: CreateOwnerDto): Promise<import("../../entities/owner.entity").Owner>;
    update(id: string, updateOwnerDto: any): Promise<import("../../entities/owner.entity").Owner>;
    remove(id: string): Promise<import("../../entities/owner.entity").Owner>;
}
