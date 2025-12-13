import { Gender } from '../../../entities/cattle.entity';
declare class CattleSourceDto {
    type: string;
    supplier?: string;
    purchaseDate?: Date;
    purchasePrice?: number;
    purchaseWeight?: number;
    purchaseHealthStatus?: string;
    purchaseNotes?: string;
    motherId?: string;
}
export declare class CreateCattleDto {
    name: string;
    nickname?: string;
    gender: Gender;
    birthDate: Date;
    character?: string;
    brand?: string;
    distinctiveSign?: string;
    photo?: string;
    source: CattleSourceDto;
    category?: string;
    owner_id?: string;
    herd_book_id?: string;
    events?: any[];
    treatments?: any[];
}
export {};
