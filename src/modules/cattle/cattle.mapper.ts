import { BaseMapper } from '../../common/mappers/base.mapper';
import { Cattle } from '../../entities/cattle.entity';

export class CattleMapper extends BaseMapper {
    static toResponse(cattle: Cattle, herdBookId?: string) {
        if (!cattle) return null;

        // Find relevant herd book entry
        const entry = this.getRelevantEntry(cattle, herdBookId);

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
            createdAt: cattle.createdAt,
            updatedAt: cattle.updatedAt,

            // Flattened HerdBookCattle fields
            category: entry?.category ? {
                id: entry.category.id,
                name: entry.category.name
            } : null,
            status: entry?.status ? {
                id: entry.status.id,
                name: entry.status.name
            } : null,
            nCarnet: entry?.nCarnet || null,
            ownerId: entry?.herdBook?.ownerId || entry?.herdBookId || null,

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

    private static getRelevantEntry(cattle: Cattle, herdBookId?: string) {
        if (!cattle.herdBookEntries || cattle.herdBookEntries.length === 0) return null;
        
        if (herdBookId) {
            const entry = cattle.herdBookEntries.find(e => e.herdBookId === herdBookId);
            if (entry) return entry;
        }
        
        return cattle.herdBookEntries[0];
    }

    static toResponseList(entities: Cattle[], herdBookId?: string) {
        return this.mapList(entities, (e) => this.toResponse(e, herdBookId));
    }
}
