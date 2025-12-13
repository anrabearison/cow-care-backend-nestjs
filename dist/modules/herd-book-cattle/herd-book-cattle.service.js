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
exports.HerdBookCattleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const herd_book_cattle_entity_1 = require("../../entities/herd-book-cattle.entity");
const case_transform_util_1 = require("../../common/utils/case-transform.util");
let HerdBookCattleService = class HerdBookCattleService {
    constructor(herdBookCattleRepo) {
        this.herdBookCattleRepo = herdBookCattleRepo;
    }
    async findAll(query, user) {
        const { page = 1, per_page = 10, sort = 'createdAt', order = 'DESC', q, herd_book_id, cattle_id, category_id, status_id, id } = query;
        const qb = this.herdBookCattleRepo.createQueryBuilder('hbc');
        qb.leftJoinAndSelect('hbc.herdBook', 'herdBook');
        qb.leftJoinAndSelect('hbc.cattle', 'cattle');
        if (user.role !== 'SUPER_ADMIN') {
            qb.andWhere('hbc.herdBookId = :herdBookId', { herdBookId: user.owner_id });
        }
        if (herd_book_id)
            qb.andWhere('hbc.herdBookId = :herdBookId', { herdBookId: herd_book_id });
        if (cattle_id)
            qb.andWhere('hbc.cattleId = :cattleId', { cattleId: cattle_id });
        if (category_id)
            qb.andWhere('hbc.categoryId = :categoryId', { categoryId: category_id });
        if (status_id)
            qb.andWhere('hbc.statusId = :statusId', { statusId: status_id });
        if (id)
            qb.andWhere('hbc.id IN (:...ids)', { ids: Array.isArray(id) ? id : [id] });
        if (q) {
            qb.andWhere('(hbc.nCarnet ILIKE :search OR hbc.categoryId ILIKE :search)', { search: `%${q}%` });
        }
        qb.orderBy(`hbc.${sort}`, order);
        qb.skip((page - 1) * per_page).take(per_page);
        const [rawData, total] = await qb.getManyAndCount();
        const data = (0, case_transform_util_1.transformKeysToSnakeCase)(rawData);
        return { data, total, page: Number(page), per_page: Number(per_page) };
    }
    async findOne(id) {
        const entity = await this.herdBookCattleRepo.findOne({
            where: { id },
            relations: ['herdBook', 'cattle']
        });
        if (!entity)
            throw new common_1.NotFoundException('HerdBookCattle not found');
        return (0, case_transform_util_1.transformKeysToSnakeCase)(entity);
    }
    async create(dto) {
        const entity = this.herdBookCattleRepo.create(dto);
        const saved = await this.herdBookCattleRepo.save(entity);
        return (0, case_transform_util_1.transformKeysToSnakeCase)(saved);
    }
    async update(id, dto) {
        await this.herdBookCattleRepo.update({ id }, dto);
        const updated = await this.herdBookCattleRepo.findOne({ where: { id } });
        if (!updated)
            throw new common_1.NotFoundException('HerdBookCattle not found');
        return (0, case_transform_util_1.transformKeysToSnakeCase)(updated);
    }
    async remove(id) {
        const entity = await this.herdBookCattleRepo.findOne({ where: { id } });
        if (!entity)
            throw new common_1.NotFoundException('HerdBookCattle not found');
        await this.herdBookCattleRepo.remove(entity);
        return (0, case_transform_util_1.transformKeysToSnakeCase)(entity);
    }
};
exports.HerdBookCattleService = HerdBookCattleService;
exports.HerdBookCattleService = HerdBookCattleService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(herd_book_cattle_entity_1.HerdBookCattle)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], HerdBookCattleService);
//# sourceMappingURL=herd-book-cattle.service.js.map