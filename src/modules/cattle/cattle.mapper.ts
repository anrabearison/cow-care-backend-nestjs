import { Cattle } from '../../entities/cattle.entity';

export class CattleMapper {
    static toResponse(cattle: Cattle, herdBookId?: string) {
        if (!cattle) {
            return null;
        }

        // Find relevant herd book entry
        let entry = null;
        if (cattle.herdBookEntries && cattle.herdBookEntries.length > 0) {
            if (herdBookId) {
                entry = cattle.herdBookEntries.find(e => e.herdBookId === herdBookId);
            }
            if (!entry) {
                entry = cattle.herdBookEntries[0];
            }
        }

        return {
            id: cattle.id,
            name: cattle.name,
            nickname: cattle.nickname,
            gender: cattle.gender,
            birthDate: cattle.birthDate,
            character: cattle.character ? {
                id: cattle.character.id,
                name: cattle.character.name
            } : null,
            brand: cattle.brand,
            distinctiveSign: cattle.distinctiveSign,
            photo: cattle.photo,
            created_at: cattle.createdAt,
            updated_at: cattle.updatedAt,

            // Flattened HerdBookCattle fields
            category: entry?.category ? {
                id: entry.category.id,
                name: entry.category.name
            } : null,
            status: entry?.status ? {
                id: entry.status.id,
                name: entry.status.name
            } : null,
            n_carnet: entry?.nCarnet || null,
            owner_id: entry?.herdBook?.ownerId || entry?.herdBookId || null,

            // Structured source object
            source: {
                type: cattle.sourceType,
                supplier: cattle.sourceSupplier,
                purchaseDate: cattle.sourcePurchaseDate,
                purchasePrice: cattle.sourcePurchasePrice ? Number(cattle.sourcePurchasePrice) : null,
                purchaseWeight: cattle.sourcePurchaseWeight ? Number(cattle.sourcePurchaseWeight) : null,
                purchaseHealthStatus: cattle.sourcePurchaseHealthStatus,
                purchaseNotes: cattle.sourcePurchaseNotes,
                motherId: cattle.sourceMotherId,
            },

            // Relations
            events: cattle.events || [],
            treatments: cattle.treatments || [],
            herdBookEntries: cattle.herdBookEntries || []
        };
    }
}
