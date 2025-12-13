import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Treatment } from '../../entities/treatment.entity';
import { CreateTreatmentDto } from './dto/create-treatment.dto';
import { User } from '../../entities/user.entity';

@Injectable()
export class TreatmentsService {
    constructor(
        @InjectRepository(Treatment)
        private treatmentsRepository: Repository<Treatment>,
    ) { }

    async findAll(query: any, user: User) {
        const {
            page = 1,
            per_page = 10,
            sort = 'date',
            order = 'DESC',
            cattle_id,
            type
        } = query;

        const skip = (page - 1) * per_page;

        const qb = this.treatmentsRepository.createQueryBuilder('treatment')
            .leftJoinAndSelect('treatment.cattle', 'cattle')
            .leftJoinAndSelect('treatment.medicament', 'medicament')
            .leftJoinAndSelect('treatment.veterinarian', 'veterinarian');

        if (cattle_id) {
            qb.andWhere('treatment.cattleId = :cattleId', { cattleId: cattle_id });
        }

        if (type) {
            qb.andWhere('treatment.type = :type', { type });
        }

        qb.orderBy(`treatment.${sort}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [data, total] = await qb.getManyAndCount();

        // Map dosage fields to nested object for frontend compatibility
        const mappedData = data.map(item => ({
            ...item,
            product: item.medicamentId,
            veterinarian: item.veterinarianId,
            dosage: {
                quantite: item.dosageQuantite,
                unite: item.dosageUnite,
                animal_poids: item.animalPoids,
                notes: item.dosageNotes
            }
        }));

        return {
            data: mappedData,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string, user: User) {
        const treatment = await this.treatmentsRepository.findOne({
            where: { id },
            relations: ['cattle', 'medicament', 'veterinarian']
        });

        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }

        return {
            ...treatment,
            product: treatment.medicamentId,
            veterinarian: treatment.veterinarianId,
            dosage: {
                quantite: treatment.dosageQuantite,
                unite: treatment.dosageUnite,
                animal_poids: treatment.animalPoids,
                notes: treatment.dosageNotes
            }
        };
    }

    async create(createTreatmentDto: CreateTreatmentDto, user: User) {
        const treatment = this.treatmentsRepository.create({
            id: crypto.randomUUID(),
            cattleId: createTreatmentDto.cattleId,
            type: createTreatmentDto.type,
            date: createTreatmentDto.date,
            medicamentId: createTreatmentDto.product,
            veterinarianId: createTreatmentDto.veterinarian,
            notes: createTreatmentDto.notes,
            administrationRoute: createTreatmentDto.administration_route,

            // Map dosage fields
            dosageQuantite: createTreatmentDto.dosage.quantite,
            dosageUnite: createTreatmentDto.dosage.unite,
            animalPoids: createTreatmentDto.dosage.animal_poids,
            dosageNotes: createTreatmentDto.dosage.notes,
        });

        await this.treatmentsRepository.save(treatment);
        return this.findOne(treatment.id, user);
    }

    async update(id: string, updateTreatmentDto: any, user: User) {
        const treatment = await this.treatmentsRepository.findOne({ where: { id } });
        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }

        // Handle updates (simplified)
        if (updateTreatmentDto.dosage) {
            treatment.dosageQuantite = updateTreatmentDto.dosage.quantite;
            treatment.dosageUnite = updateTreatmentDto.dosage.unite;
            treatment.animalPoids = updateTreatmentDto.dosage.animal_poids;
            treatment.dosageNotes = updateTreatmentDto.dosage.notes;
        }

        // Update other fields...
        Object.assign(treatment, updateTreatmentDto);
        // Remove nested objects that shouldn't be saved directly
        delete (treatment as any).dosage;

        await this.treatmentsRepository.save(treatment);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const treatment = await this.treatmentsRepository.findOne({ where: { id } });
        if (!treatment) {
            throw new NotFoundException(`Treatment with ID ${id} not found`);
        }
        await this.treatmentsRepository.remove(treatment);
        return treatment;
    }
}
