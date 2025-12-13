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
exports.HerdBooksController = void 0;
const common_1 = require("@nestjs/common");
const herd_books_service_1 = require("./herd-books.service");
const create_herd_book_dto_1 = require("./dto/create-herd-book.dto");
const common_2 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const user_entity_1 = require("../../entities/user.entity");
let HerdBooksController = class HerdBooksController {
    constructor(herdBooksService) {
        this.herdBooksService = herdBooksService;
    }
    async findAll(query, res) {
        const result = await this.herdBooksService.findAll(query);
        res.set('Content-Range', `herd-books ${(result.page - 1) * result.per_page}-${(result.page - 1) * result.per_page + result.data.length}/${result.total}`);
        res.set('X-Total-Count', result.total.toString());
        res.set('Access-Control-Expose-Headers', 'Content-Range, X-Total-Count');
        return res.json(result);
    }
    findOne(id) {
        return this.herdBooksService.findOne(id);
    }
    create(createHerdBookDto) {
        return this.herdBooksService.create(createHerdBookDto);
    }
    update(id, updateHerdBookDto) {
        return this.herdBooksService.update(id, updateHerdBookDto);
    }
    remove(id) {
        return this.herdBooksService.remove(id);
    }
};
exports.HerdBooksController = HerdBooksController;
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_2.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], HerdBooksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HerdBooksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_herd_book_dto_1.CreateHerdBookDto]),
    __metadata("design:returntype", void 0)
], HerdBooksController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_herd_book_dto_1.UpdateHerdBookDto]),
    __metadata("design:returntype", void 0)
], HerdBooksController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HerdBooksController.prototype, "remove", null);
exports.HerdBooksController = HerdBooksController = __decorate([
    (0, common_1.Controller)('api/v1/herd-books'),
    (0, common_2.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [herd_books_service_1.HerdBooksService])
], HerdBooksController);
//# sourceMappingURL=herd-books.controller.js.map