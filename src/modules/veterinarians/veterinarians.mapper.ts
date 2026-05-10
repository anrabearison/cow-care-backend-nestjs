import { Veterinarian } from '../../entities/veterinarian.entity';

export class VeterinariansMapper {
    static toResponse(vet: Veterinarian) {
        return {
            id: vet.id,
            name: vet.name,
            specialite: vet.specialite,
            phone: vet.phone,
            email: vet.email,
            address: vet.address,
            notes: vet.notes,
            createdAt: vet.createdAt,
            updatedAt: vet.updatedAt,
        };
    }

    static toResponseList(vets: Veterinarian[]) {
        return vets.map(vet => this.toResponse(vet));
    }
}
