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
exports.MedicamentsController = void 0;
const common_1 = require("@nestjs/common");
const medicaments_service_1 = require("./medicaments.service");
const create_medicament_dto_1 = require("./dto/create-medicament.dto");
let MedicamentsController = class MedicamentsController {
    constructor(medicamentsService) {
        this.medicamentsService = medicamentsService;
    }
    async findAll(res) {
        const medicaments = await this.medicamentsService.findAll();
        res.set('X-Total-Count', medicaments.length.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return res.json(medicaments);
    }
    findOne(id) {
        return this.medicamentsService.findOne(id);
    }
    create(createMedicamentDto) {
        return this.medicamentsService.create(createMedicamentDto);
    }
    update(id, updateMedicamentDto) {
        return this.medicamentsService.update(id, updateMedicamentDto);
    }
    remove(id) {
        return this.medicamentsService.remove(id);
    }
};
exports.MedicamentsController = MedicamentsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MedicamentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MedicamentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_medicament_dto_1.CreateMedicamentDto]),
    __metadata("design:returntype", void 0)
], MedicamentsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_medicament_dto_1.UpdateMedicamentDto]),
    __metadata("design:returntype", void 0)
], MedicamentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MedicamentsController.prototype, "remove", null);
exports.MedicamentsController = MedicamentsController = __decorate([
    (0, common_1.Controller)('api/v1/medicaments'),
    __metadata("design:paramtypes", [medicaments_service_1.MedicamentsService])
], MedicamentsController);
//# sourceMappingURL=medicaments.controller.js.map