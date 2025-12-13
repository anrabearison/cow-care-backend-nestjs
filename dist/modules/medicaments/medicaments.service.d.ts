import { Repository } from 'typeorm';
import { Medicament } from '../../entities/medicament.entity';
import { CreateMedicamentDto, UpdateMedicamentDto } from './dto/create-medicament.dto';
export declare class MedicamentsService {
    private medicamentsRepository;
    constructor(medicamentsRepository: Repository<Medicament>);
    findAll(): Promise<Medicament[]>;
    findOne(id: string): Promise<Medicament>;
    create(createMedicamentDto: CreateMedicamentDto): Promise<Medicament>;
    update(id: string, updateMedicamentDto: UpdateMedicamentDto): Promise<Medicament>;
    remove(id: string): Promise<void>;
}
