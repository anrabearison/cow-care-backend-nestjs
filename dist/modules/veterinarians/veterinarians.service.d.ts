import { Repository } from 'typeorm';
import { Veterinarian } from '../../entities/veterinarian.entity';
import { CreateVeterinarianDto, UpdateVeterinarianDto } from './dto/create-veterinarian.dto';
export declare class VeterinariansService {
    private veterinariansRepository;
    constructor(veterinariansRepository: Repository<Veterinarian>);
    findAll(): Promise<Veterinarian[]>;
    findOne(id: string): Promise<Veterinarian>;
    create(createVeterinarianDto: CreateVeterinarianDto): Promise<Veterinarian>;
    update(id: string, updateVeterinarianDto: UpdateVeterinarianDto): Promise<Veterinarian>;
    remove(id: string): Promise<void>;
}
