"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnersModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const owners_service_1 = require("./owners.service");
const owners_controller_1 = require("./owners.controller");
const owner_entity_1 = require("../../entities/owner.entity");
let OwnersModule = class OwnersModule {
};
exports.OwnersModule = OwnersModule;
exports.OwnersModule = OwnersModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([owner_entity_1.Owner]),
        ],
        controllers: [owners_controller_1.OwnersController],
        providers: [owners_service_1.OwnersService],
        exports: [owners_service_1.OwnersService],
    })
], OwnersModule);
//# sourceMappingURL=owners.module.js.map