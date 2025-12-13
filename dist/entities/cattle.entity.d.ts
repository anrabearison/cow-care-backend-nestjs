import { Character } from './character.entity';
import { Event } from './event.entity';
import { Treatment } from './treatment.entity';
import { HerdBookCattle } from './herd-book-cattle.entity';
export declare enum Gender {
    M = "M",
    F = "F"
}
export declare enum SourceType {
    ACHETE = "Achet\u00E9",
    NE_DANS_TROUPEAU = "N\u00E9 dans le troupeau"
}
export declare class Cattle {
    id: string;
    name: string;
    nickname: string;
    gender: Gender;
    birthDate: Date;
    characterId: string;
    character: Character;
    brand: string;
    distinctiveSign: string;
    photo: string;
    sourceType: SourceType;
    sourceSupplier: string;
    sourcePurchaseDate: Date;
    sourcePurchasePrice: number;
    sourcePurchaseWeight: number;
    sourcePurchaseHealthStatus: string;
    sourcePurchaseNotes: string;
    sourceMotherId: string;
    mother: Cattle;
    events: Event[];
    treatments: Treatment[];
    herdBookEntries: HerdBookCattle[];
    createdAt: Date;
    updatedAt: Date;
    get source(): {
        type: SourceType;
        supplier: string;
        purchaseDate: Date;
        purchasePrice: number;
        purchaseWeight: number;
        purchaseHealthStatus: string;
        purchaseNotes: string;
        motherId: string;
    };
}
