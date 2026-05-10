import { Veterinarian } from '../../entities/veterinarian.entity';

export class VeterinariansMapper {
    static toResponse(vet: Veterinarian) {
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

    static toResponseList(vets: Veterinarian[]) {
        return vets.map(vet => this.toResponse(vet));
    }
}
