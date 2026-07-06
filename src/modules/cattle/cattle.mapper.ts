import { BaseMapper } from '../../common/mappers/base.mapper';
import { Cattle } from './entities/cattle.entity';
import { TreatmentsMapper } from '../treatments/treatments.mapper';

export class CattleMapper extends BaseMapper {
    static toResponse(cattle: Cattle, herdBookId?: string) {
        if (!cattle) return null;

        // Find relevant herd book entry
        const entry = this.getRelevantEntry(cattle, herdBookId);

        const photos = (cattle.photos || [])
            .slice()
            .sort((a, b) => a.position - b.position)
            .map(photo => ({
                id: photo.id,
                url: photo.url,
                publicId: photo.publicId,
                position: photo.position,
                isPrimary: photo.isPrimary,
            }));

        const primaryPhoto = photos.find(photo => photo.isPrimary) || photos[0];

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
            photo: primaryPhoto?.url || cattle.photo,
            photos,
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
            ownerId: cattle.ownerId,
            motherId: cattle.motherId,
            fatherId: cattle.fatherId,

            // Structured source object
            source: {
                type: cattle.sourceType,
                supplier: cattle.sourceSupplier || null,
                purchaseDate: cattle.sourcePurchaseDate || null,
                purchasePrice: cattle.sourcePurchasePrice || null,
                purchaseWeight: cattle.sourcePurchaseWeight || null,
                purchaseHealthStatus: cattle.sourcePurchaseHealthStatus || null,
                purchaseNotes: cattle.sourcePurchaseNotes || null,
                motherId: cattle.sourceMotherId || null,
            },

            // Relations
            events: cattle.events || [],
            treatments: TreatmentsMapper.toResponseList(cattle.treatments || []),
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
