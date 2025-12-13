import { Repository } from 'typeorm';
import { Cattle, Gender, SourceType } from '../../entities/cattle.entity';
import { CreateCattleDto } from './dto/create-cattle.dto';
import { User } from '../../entities/user.entity';
import { HerdBook } from '../../entities/herd-book.entity';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { Character } from '../../entities/character.entity';
export declare class CattleService {
    private cattleRepository;
    private herdBookRepository;
    private herdBookCattleRepository;
    private characterRepository;
    constructor(cattleRepository: Repository<Cattle>, herdBookRepository: Repository<HerdBook>, herdBookCattleRepository: Repository<HerdBookCattle>, characterRepository: Repository<Character>);
    findAll(query: any, user: User): Promise<{
        data: {
            id: string;
            name: string;
            nickname: string;
            gender: Gender;
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
                type: SourceType;
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
            herdBookEntries: HerdBookCattle[];
        }[];
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string, user: User): Promise<{
        id: string;
        name: string;
        nickname: string;
        gender: Gender;
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
            type: SourceType;
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
        herdBookEntries: HerdBookCattle[];
    }>;
    private toResponse;
    create(createCattleDto: CreateCattleDto, user: User): Promise<{
        id: string;
        name: string;
        nickname: string;
        gender: Gender;
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
            type: SourceType;
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
        herdBookEntries: HerdBookCattle[];
    }>;
    update(id: string, updateCattleDto: any, user: User): Promise<{
        id: string;
        name: string;
        nickname: string;
        gender: Gender;
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
            type: SourceType;
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
        herdBookEntries: HerdBookCattle[];
    }>;
    remove(id: string, user: User): Promise<{
        id: string;
        name: string;
        nickname: string;
        gender: Gender;
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
            type: SourceType;
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
        herdBookEntries: HerdBookCattle[];
    }>;
    getStatistics(ownerId: string, user: User): Promise<{
        total: number;
        males: number;
        females: number;
        calves: number;
        heifers: number;
        cows: number;
        bulls: number;
    }>;
}
