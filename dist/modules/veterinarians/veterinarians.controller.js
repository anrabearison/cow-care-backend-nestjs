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
exports.VeterinariansController = void 0;
const common_1 = require("@nestjs/common");
const veterinarians_service_1 = require("./veterinarians.service");
const create_veterinarian_dto_1 = require("./dto/create-veterinarian.dto");
let VeterinariansController = class VeterinariansController {
    constructor(veterinariansService) {
        this.veterinariansService = veterinariansService;
    }
    async findAll(res) {
        const veterinarians = await this.veterinariansService.findAll();
        res.set('X-Total-Count', veterinarians.length.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return res.json(veterinarians);
    }
    findOne(id) {
        return this.veterinariansService.findOne(id);
    }
    create(createVeterinarianDto) {
        return this.veterinariansService.create(createVeterinarianDto);
    }
    update(id, updateVeterinarianDto) {
        return this.veterinariansService.update(id, updateVeterinarianDto);
    }
    remove(id) {
        return this.veterinariansService.remove(id);
    }
};
exports.VeterinariansController = VeterinariansController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VeterinariansController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VeterinariansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_veterinarian_dto_1.CreateVeterinarianDto]),
    __metadata("design:returntype", void 0)
], VeterinariansController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_veterinarian_dto_1.UpdateVeterinarianDto]),
    __metadata("design:returntype", void 0)
], VeterinariansController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VeterinariansController.prototype, "remove", null);
exports.VeterinariansController = VeterinariansController = __decorate([
    (0, common_1.Controller)('api/v1/veterinarians'),
    __metadata("design:paramtypes", [veterinarians_service_1.VeterinariansService])
], VeterinariansController);
//# sourceMappingURL=veterinarians.controller.js.map