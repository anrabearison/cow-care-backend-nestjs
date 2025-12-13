"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CattleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cattle_entity_1 = require("../../entities/cattle.entity");
const user_entity_1 = require("../../entities/user.entity");
const herd_book_entity_1 = require("../../entities/herd-book.entity");
const herd_book_cattle_entity_1 = require("../../entities/herd-book-cattle.entity");
const character_entity_1 = require("../../entities/character.entity");
let CattleService = class CattleService {
    constructor(cattleRepository, herdBookRepository, herdBookCattleRepository, characterRepository) {
        this.cattleRepository = cattleRepository;
        this.herdBookRepository = herdBookRepository;
        this.herdBookCattleRepository = herdBookCattleRepository;
        this.characterRepository = characterRepository;
    }
    async findAll(query, user) {
        const { page = 1, per_page = 10, sort = 'id', order = 'ASC', q, gender, category, character, source_type, owner_id, herd_book_id } = query;
        const skip = (page - 1) * per_page;
        const qb = this.cattleRepository.createQueryBuilder('cattle')
            .leftJoinAndSelect('cattle.character', 'character')
            .leftJoinAndSelect('cattle.herdBookEntries', 'herdBookEntries')
            .leftJoinAndSelect('herdBookEntries.herdBook', 'herdBook')
            .leftJoinAndSelect('herdBookEntries.category', 'category')
            .leftJoinAndSelect('herdBookEntries.status', 'status')
            .leftJoinAndSelect('cattle.events', 'events')
            .leftJoinAndSelect('cattle.treatments', 'treatments');
        if (user.role !== user_entity_1.UserRole.SUPER_ADMIN) {
            if (user.ownerId) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: user.ownerId });
            }
            else {
                return { data: [], total: 0, page: Number(page), per_page: Number(per_page) };
            }
        }
        else {
            if (owner_id) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: owner_id });
            }
        }
        if (herd_book_id) {
            qb.andWhere('herdBook.id = :herdBookId', { herdBookId: herd_book_id });
        }
        if (q) {
            qb.andWhere('(cattle.name ILIKE :q OR cattle.nickname ILIKE :q OR cattle.id ILIKE :q)', { q: `%${q}%` });
        }
        if (gender) {
            qb.andWhere('cattle.gender = :gender', { gender });
        }
        if (character) {
            qb.andWhere('cattle.characterId = :character', { character });
        }
        if (source_type) {
            qb.andWhere('cattle.sourceType = :sourceType', { sourceType: source_type });
        }
        if (category) {
            qb.andWhere('herdBookEntries.categoryId = :category', { category });
        }
        qb.distinct(true);
        qb.orderBy(`cattle.${sort}`, order);
        qb.skip(skip).take(per_page);
        const [rawData, total] = await qb.getManyAndCount();
        const data = rawData.map(cattle => this.toResponse(cattle, herd_book_id));
        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }
    async findOne(id, user) {
        const qb = this.cattleRepository.createQueryBuilder('cattle')
            .leftJoinAndSelect('cattle.character', 'character')
            .leftJoinAndSelect('cattle.mother', 'mother')
            .leftJoinAndSelect('cattle.herdBookEntries', 'herdBookEntries')
            .leftJoinAndSelect('herdBookEntries.herdBook', 'herdBook')
            .leftJoinAndSelect('herdBookEntries.category', 'category')
            .leftJoinAndSelect('herdBookEntries.status', 'status')
            .leftJoinAndSelect('cattle.events', 'events')
            .leftJoinAndSelect('cattle.treatments', 'treatments')
            .where('cattle.id = :id', { id });
        const cattle = await qb.getOne();
        if (!cattle) {
            throw new common_1.NotFoundException(`Cattle with ID ${id} not found`);
        }
        return this.toResponse(cattle);
    }
    toResponse(cattle, herdBookId) {
        var _a;
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
            category: (entry === null || entry === void 0 ? void 0 : entry.category) ? {
                id: entry.category.id,
                name: entry.category.name
            } : null,
            status: (entry === null || entry === void 0 ? void 0 : entry.status) ? {
                id: entry.status.id,
                name: entry.status.name
            } : null,
            n_carnet: (entry === null || entry === void 0 ? void 0 : entry.nCarnet) || null,
            owner_id: ((_a = entry === null || entry === void 0 ? void 0 : entry.herdBook) === null || _a === void 0 ? void 0 : _a.ownerId) || null,
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
            events: cattle.events || [],
            treatments: cattle.treatments || [],
            herdBookEntries: cattle.herdBookEntries || []
        };
    }
    async create(createCattleDto, user) {
        try {
            const { character, events, treatments, source } = createCattleDto, cattleData = __rest(createCattleDto, ["character", "events", "treatments", "source"]);
            let sourceType = source.type;
            if (sourceType === 'Acheté' || sourceType === 'ACHETE') {
                sourceType = cattle_entity_1.SourceType.ACHETE;
            }
            else if (sourceType === 'Né dans le troupeau' || sourceType === 'NE_DANS_TROUPEAU') {
                sourceType = cattle_entity_1.SourceType.NE_DANS_TROUPEAU;
            }
            const cattle = this.cattleRepository.create(Object.assign(Object.assign({}, cattleData), { id: crypto.randomUUID(), characterId: character, sourceType: sourceType, sourceSupplier: source.supplier, sourcePurchaseDate: source.purchaseDate, sourcePurchasePrice: source.purchasePrice, sourcePurchaseWeight: source.purchaseWeight, sourcePurchaseHealthStatus: source.purchaseHealthStatus, sourcePurchaseNotes: source.purchaseNotes, sourceMotherId: source.motherId }));
            await this.cattleRepository.save(cattle);
            if (createCattleDto.herd_book_id) {
                const entry = this.herdBookCattleRepository.create({
                    id: crypto.randomUUID(),
                    cattleId: cattle.id,
                    herdBookId: createCattleDto.herd_book_id,
                    categoryId: createCattleDto.category || 'default_category_id',
                    statusId: 'STAT004',
                });
                await this.herdBookCattleRepository.save(entry);
            }
            return this.findOne(cattle.id, user);
        }
        catch (error) {
            console.error('Error creating cattle:', error);
            throw error;
        }
    }
    async update(id, updateCattleDto, user) {
        const cattle = await this.findOne(id, user);
        Object.assign(cattle, updateCattleDto);
        await this.cattleRepository.save(cattle);
        return this.findOne(id, user);
    }
    async remove(id, user) {
        const cattle = await this.cattleRepository.findOne({
            where: { id },
            relations: ['character', 'herdBookEntries', 'herdBookEntries.herdBook', 'herdBookEntries.category', 'herdBookEntries.status']
        });
        if (!cattle) {
            throw new common_1.NotFoundException(`Cattle with ID ${id} not found`);
        }
        const response = this.toResponse(cattle);
        await this.cattleRepository.remove(cattle);
        return response;
    }
    async getStatistics(ownerId, user) {
        const totalCattle = await this.cattleRepository.count();
        const males = await this.cattleRepository.count({ where: { gender: cattle_entity_1.Gender.M } });
        const females = await this.cattleRepository.count({ where: { gender: cattle_entity_1.Gender.F } });
        return {
            total: totalCattle,
            males,
            females,
            calves: 0,
            heifers: 0,
            cows: 0,
            bulls: 0
        };
    }
};
exports.CattleService = CattleService;
exports.CattleService = CattleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cattle_entity_1.Cattle)),
    __param(1, (0, typeorm_1.InjectRepository)(herd_book_entity_1.HerdBook)),
    __param(2, (0, typeorm_1.InjectRepository)(herd_book_cattle_entity_1.HerdBookCattle)),
    __param(3, (0, typeorm_1.InjectRepository)(character_entity_1.Character)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CattleService);
//# sourceMappingURL=cattle.service.js.map