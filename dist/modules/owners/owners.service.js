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
exports.OwnersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const owner_entity_1 = require("../../entities/owner.entity");
const case_transform_util_1 = require("../../common/utils/case-transform.util");
let OwnersService = class OwnersService {
    constructor(ownersRepository) {
        this.ownersRepository = ownersRepository;
    }
    async findAll(query, user) {
        const { page = 1, per_page = 10, sort = 'name', order = 'ASC', q, id } = query;
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
        const qb = this.ownersRepository.createQueryBuilder('owner');
        if (user) {
            const UserRole = { SUPER_ADMIN: 'SUPER_ADMIN', OWNER_ADMIN: 'OWNER_ADMIN', OWNER_USER: 'OWNER_USER' };
            if (user.role === UserRole.SUPER_ADMIN) {
            }
            else if (user.ownerId) {
                qb.andWhere('owner.id = :ownerId', { ownerId: user.ownerId });
            }
            else {
                return {
                    data: [],
                    total: 0,
                    page: Number(page),
                    per_page: Number(per_page)
                };
            }
        }
        if (id) {
            const ids = Array.isArray(id) ? id : [id];
            qb.andWhere('owner.id IN (:...ids)', { ids });
        }
        if (q) {
            qb.andWhere('(owner.name ILIKE :q OR owner.contactInfo ILIKE :q OR owner.address ILIKE :q)', { q: `%${q}%` });
        }
        qb.orderBy(`owner.${sort}`, order);
        qb.skip(skip).take(per_page);
        const [rawData, total] = await qb.getManyAndCount();
        const data = (0, case_transform_util_1.transformKeysToSnakeCase)(rawData);
        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }
    async findOne(id) {
        const owner = await this.ownersRepository.findOne({ where: { id } });
        if (!owner) {
            throw new common_1.NotFoundException(`Owner with ID ${id} not found`);
        }
        return owner;
    }
    async create(createOwnerDto) {
        const owner = this.ownersRepository.create(Object.assign(Object.assign({}, createOwnerDto), { id: crypto.randomUUID() }));
        await this.ownersRepository.save(owner);
        return owner;
    }
    async update(id, updateOwnerDto) {
        const owner = await this.findOne(id);
        Object.assign(owner, updateOwnerDto);
        await this.ownersRepository.save(owner);
        return owner;
    }
    async remove(id) {
        const owner = await this.findOne(id);
        await this.ownersRepository.remove(owner);
        return owner;
    }
};
exports.OwnersService = OwnersService;
exports.OwnersService = OwnersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(owner_entity_1.Owner)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], OwnersService);
//# sourceMappingURL=owners.service.js.map