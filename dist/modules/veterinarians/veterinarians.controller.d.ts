import { VeterinariansService } from './veterinarians.service';
import { CreateVeterinarianDto, UpdateVeterinarianDto } from './dto/create-veterinarian.dto';
import { Response } from 'express';
export declare class VeterinariansController {
    private readonly veterinariansService;
    constructor(veterinariansService: VeterinariansService);
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    findOne(id: string): Promise<import("../../entities/veterinarian.entity").Veterinarian>;
    create(createVeterinarianDto: CreateVeterinarianDto): Promise<import("../../entities/veterinarian.entity").Veterinarian>;
    update(id: string, updateVeterinarianDto: UpdateVeterinarianDto): Promise<import("../../entities/veterinarian.entity").Veterinarian>;
    remove(id: string): Promise<void>;
}
