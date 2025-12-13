import { Response } from 'express';
import { CattleService } from './cattle.service';
import { CreateCattleDto } from './dto/create-cattle.dto';
export declare class CattleController {
    private readonly cattleService;
    constructor(cattleService: CattleService);
    getStatistics(ownerId: string, req: any): Promise<{
        total: number;
        males: number;
        females: number;
        calves: number;
        heifers: number;
        cows: number;
        bulls: number;
    }>;
    findAll(query: any, res: Response, req: any): Promise<void>;
    findOne(id: string, req: any): Promise<{
        id: string;
        name: string;
        nickname: string;
        gender: import("../../entities/cattle.entity").Gender;
        birthDate: Date;
        character: {
            id: string;
            name: string;
        };
        brand: string;
        distinctiveSign: string;
        photo: string;
        created_at: Date;
        updated_at: Date;
        category: {
            id: any;
            name: any;
        };
        status: {
            id: any;
            name: any;
        };
        n_carnet: any;
        owner_id: any;
        source: {
            type: import("../../entities/cattle.entity").SourceType;
            supplier: string;
            purchaseDate: Date;
            purchasePrice: number;
            purchaseWeight: number;
            purchaseHealthStatus: string;
            purchaseNotes: string;
            motherId: string;
        };
        events: import("../../entities/event.entity").Event[];
        treatments: import("../../entities/treatment.entity").Treatment[];
        herdBookEntries: import("../../entities/herd-book-cattle.entity").HerdBookCattle[];
    }>;
    create(createCattleDto: CreateCattleDto, herdBookId: string, req: any): Promise<{
        id: string;
        name: string;
        nickname: string;
        gender: import("../../entities/cattle.entity").Gender;
        birthDate: Date;
        character: {
            id: string;
            name: string;
        };
        brand: string;
        distinctiveSign: string;
        photo: string;
        created_at: Date;
        updated_at: Date;
        category: {
            id: any;
            name: any;
        };
        status: {
            id: any;
            name: any;
        };
        n_carnet: any;
        owner_id: any;
        source: {
            type: import("../../entities/cattle.entity").SourceType;
            supplier: string;
            purchaseDate: Date;
            purchasePrice: number;
            purchaseWeight: number;
            purchaseHealthStatus: string;
            purchaseNotes: string;
            motherId: string;
        };
        events: import("../../entities/event.entity").Event[];
        treatments: import("../../entities/treatment.entity").Treatment[];
        herdBookEntries: import("../../entities/herd-book-cattle.entity").HerdBookCattle[];
    }>;
    update(id: string, updateCattleDto: any, req: any): Promise<{
        id: string;
        name: string;
        nickname: string;
        gender: import("../../entities/cattle.entity").Gender;
        birthDate: Date;
        character: {
            id: string;
            name: string;
        };
        brand: string;
        distinctiveSign: string;
        photo: string;
        created_at: Date;
        updated_at: Date;
        category: {
            id: any;
            name: any;
        };
        status: {
            id: any;
            name: any;
        };
        n_carnet: any;
        owner_id: any;
        source: {
            type: import("../../entities/cattle.entity").SourceType;
            supplier: string;
            purchaseDate: Date;
            purchasePrice: number;
            purchaseWeight: number;
            purchaseHealthStatus: string;
            purchaseNotes: string;
            motherId: string;
        };
        events: import("../../entities/event.entity").Event[];
        treatments: import("../../entities/treatment.entity").Treatment[];
        herdBookEntries: import("../../entities/herd-book-cattle.entity").HerdBookCattle[];
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        name: string;
        nickname: string;
        gender: import("../../entities/cattle.entity").Gender;
        birthDate: Date;
        character: {
            id: string;
            name: string;
        };
        brand: string;
        distinctiveSign: string;
        photo: string;
        created_at: Date;
        updated_at: Date;
        category: {
            id: any;
            name: any;
        };
        status: {
            id: any;
            name: any;
        };
        n_carnet: any;
        owner_id: any;
        source: {
            type: import("../../entities/cattle.entity").SourceType;
            supplier: string;
            purchaseDate: Date;
            purchasePrice: number;
            purchaseWeight: number;
            purchaseHealthStatus: string;
            purchaseNotes: string;
            motherId: string;
        };
        events: import("../../entities/event.entity").Event[];
        treatments: import("../../entities/treatment.entity").Treatment[];
        herdBookEntries: import("../../entities/herd-book-cattle.entity").HerdBookCattle[];
    }>;
}
