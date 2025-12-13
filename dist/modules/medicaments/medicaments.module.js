"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicamentsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const medicaments_service_1 = require("./medicaments.service");
const medicaments_controller_1 = require("./medicaments.controller");
const medicament_entity_1 = require("../../entities/medicament.entity");
let MedicamentsModule = class MedicamentsModule {
};
exports.MedicamentsModule = MedicamentsModule;
exports.MedicamentsModule = MedicamentsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([medicament_entity_1.Medicament])],
        controllers: [medicaments_controller_1.MedicamentsController],
        providers: [medicaments_service_1.MedicamentsService],
        exports: [medicaments_service_1.MedicamentsService],
    })
], MedicamentsModule);
//# sourceMappingURL=medicaments.module.js.map