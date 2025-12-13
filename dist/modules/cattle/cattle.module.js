"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CattleModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cattle_service_1 = require("./cattle.service");
const cattle_controller_1 = require("./cattle.controller");
const cattle_entity_1 = require("../../entities/cattle.entity");
const herd_book_entity_1 = require("../../entities/herd-book.entity");
const herd_book_cattle_entity_1 = require("../../entities/herd-book-cattle.entity");
const character_entity_1 = require("../../entities/character.entity");
let CattleModule = class CattleModule {
};
exports.CattleModule = CattleModule;
exports.CattleModule = CattleModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([cattle_entity_1.Cattle, herd_book_entity_1.HerdBook, herd_book_cattle_entity_1.HerdBookCattle, character_entity_1.Character]),
        ],
        controllers: [cattle_controller_1.CattleController],
        providers: [cattle_service_1.CattleService],
        exports: [cattle_service_1.CattleService],
    })
], CattleModule);
//# sourceMappingURL=cattle.module.js.map