import { MedicamentsService } from './medicaments.service';
import { CreateMedicamentDto, UpdateMedicamentDto } from './dto/create-medicament.dto';
import { Response } from 'express';
export declare class MedicamentsController {
    private readonly medicamentsService;
    constructor(medicamentsService: MedicamentsService);
    findAll(res: Response): Promise<Response<any, Record<string, any>>>;
    findOne(id: string): Promise<import("../../entities/medicament.entity").Medicament>;
    create(createMedicamentDto: CreateMedicamentDto): Promise<import("../../entities/medicament.entity").Medicament>;
    update(id: string, updateMedicamentDto: UpdateMedicamentDto): Promise<import("../../entities/medicament.entity").Medicament>;
    remove(id: string): Promise<void>;
}
