import { BaseMapper } from '../../common/mappers/base.mapper';
import { Veterinarian } from './entities/veterinarian.entity';

export class VeterinariansMapper extends BaseMapper {
    static toResponse(vet: Veterinarian) {
        if (!vet) return null;

        return {
            id: vet.id,
            name: vet.name,
            specialty: vet.specialty,
            phone: vet.phone,
            email: vet.email,
            address: vet.address,
            notes: vet.notes,
            createdAt: vet.createdAt,
            updatedAt: vet.updatedAt,
        };
    }

    static toResponseList(entities: Veterinarian[]) {
        return this.mapList(entities, (e) => this.toResponse(e));
    }
}
