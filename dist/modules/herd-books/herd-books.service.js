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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HerdBooksService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const herd_book_entity_1 = require("../../entities/herd-book.entity");
let HerdBooksService = class HerdBooksService {
    constructor(herdBooksRepository) {
        this.herdBooksRepository = herdBooksRepository;
    }
    async findAll(query = {}) {
        const { page = 1, per_page = 10, sort = 'createdAt', order = 'DESC' } = query;
        const skip = (page - 1) * per_page;
        let filters = {};
        if (query.filter) {
            try {
                filters = JSON.parse(query.filter);
            }
            catch (e) {
                filters = {};
            }
        }
        const owner_id = query.owner_id || filters['owner_id'];
        const qb = this.herdBooksRepository.createQueryBuilder('herdBook');
        if (owner_id) {
            qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: owner_id });
        }
        qb.orderBy(`herdBook.${sort}`, order);
        qb.skip(skip).take(per_page);
        const [data, total] = await qb.getManyAndCount();
        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }
    async findOne(id) {
        const herdBook = await this.herdBooksRepository.findOne({ where: { id } });
        if (!herdBook) {
            throw new common_1.NotFoundException(`HerdBook with ID ${id} not found`);
        }
        return herdBook;
    }
    async create(createHerdBookDto) {
        const herdBook = this.herdBooksRepository.create(createHerdBookDto);
        return this.herdBooksRepository.save(herdBook);
    }
    async update(id, updateHerdBookDto) {
        const herdBook = await this.findOne(id);
        Object.assign(herdBook, updateHerdBookDto);
        return this.herdBooksRepository.save(herdBook);
    }
    async remove(id) {
        const herdBook = await this.findOne(id);
        await this.herdBooksRepository.remove(herdBook);
    }
};
exports.HerdBooksService = HerdBooksService;
exports.HerdBooksService = HerdBooksService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(herd_book_entity_1.HerdBook)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HerdBooksService);
//# sourceMappingURL=herd-books.service.js.map