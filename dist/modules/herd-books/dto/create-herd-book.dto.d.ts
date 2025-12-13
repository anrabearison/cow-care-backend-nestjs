export declare class CreateHerdBookDto {
    id: string;
    reference: string;
    year: number;
    description?: string;
    ownerId: string;
}
export declare class UpdateHerdBookDto {
    reference?: string;
    year?: number;
    description?: string;
    ownerId?: string;
}
