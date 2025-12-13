import { Cattle } from './cattle.entity';
export declare class Character {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    cattle: Cattle[];
}
