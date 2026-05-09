import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Veterinarian } from '../../entities/veterinarian.entity';
import { CreateVeterinarianDto, UpdateVeterinarianDto } from './dto/create-veterinarian.dto';

@Injectable()
export class VeterinariansService {
    constructor(
        @InjectRepository(Veterinarian)
        private veterinariansRepository: Repository<Veterinarian>,
    ) { }

    // Serialize entity to frontend-compatible shape (both FR and EN field names)
    private toResponse(vet: Veterinarian) {
        return {
            id: vet.id,
            nom: vet.name,
            name: vet.name,
            specialite: vet.specialite,
            telephone: vet.phone,
            phone: vet.phone,
            email: vet.email,
            adresse: vet.address,
            address: vet.address,
            notes: vet.notes,
            created_at: vet.createdAt,
            updated_at: vet.updatedAt,
        };
    }

    async findAll(query: any) {
        const { page = 1, per_page = 10, sort = 'id', order = 'ASC', q, specialite, id } = query;
        const skip = (page - 1) * per_page;

        // Map frontend French sort field names to TypeORM TypeScript property names
        const sortFieldMap: Record<string, string> = {
            nom: 'name',
            telephone: 'phone',
            adresse: 'address',
        };
        const sortField = sortFieldMap[sort] || sort;

        const qb = this.veterinariansRepository.createQueryBuilder('veterinarian');

        if (id) {
            const ids = Array.isArray(id) ? id : [id];
            qb.andWhere('veterinarian.id IN (:...ids)', { ids });
        }

        if (q) {
            // Must use TypeORM property name "name", not DB column name "nom"
            qb.andWhere('veterinarian.name ILIKE :q', { q: `%${q}%` });
        }

        if (specialite) {
            qb.andWhere('veterinarian.specialite ILIKE :specialite', { specialite: `%${specialite}%` });
        }

        qb.orderBy(`veterinarian.${sortField}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [rawData, total] = await qb.getManyAndCount();

        return {
            data: rawData.map(v => this.toResponse(v)),
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string): Promise<Veterinarian> {
        const veterinarian = await this.veterinariansRepository.findOne({ where: { id } });
        if (!veterinarian) {
            throw new NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        return veterinarian;
    }

    async create(createVeterinarianDto: CreateVeterinarianDto): Promise<any> {
        const { nom, telephone, adresse, name, phone, address, id, ...rest } = createVeterinarianDto as any;
        const veterinarian = this.veterinariansRepository.create({
            ...rest,
            id: id || crypto.randomUUID(),
            name: name || nom,
            phone: phone || telephone,
            address: address || adresse,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const saved = await this.veterinariansRepository.save(veterinarian) as unknown as Veterinarian;
        return this.toResponse(saved);
    }

    async update(id: string, updateVeterinarianDto: UpdateVeterinarianDto): Promise<any> {
        const veterinarian = await this.findOne(id);
        const { nom, telephone, adresse, name, phone, address, ...rest } = updateVeterinarianDto as any;
        Object.assign(veterinarian, {
            ...rest,
            ...(name || nom ? { name: name || nom } : {}),
            ...(phone || telephone ? { phone: phone || telephone } : {}),
            ...(address || adresse ? { address: address || adresse } : {}),
        });
        const saved = await this.veterinariansRepository.save(veterinarian) as unknown as Veterinarian;
        return this.toResponse(saved);
    }

    async remove(id: string): Promise<void> {
        const veterinarian = await this.findOne(id);
        await this.veterinariansRepository.remove(veterinarian);
    }
}
