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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Veterinarian = void 0;
const typeorm_1 = require("typeorm");
let Veterinarian = class Veterinarian {
};
exports.Veterinarian = Veterinarian;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 50 }),
    __metadata("design:type", String)
], Veterinarian.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nom', length: 255 }),
    __metadata("design:type", String)
], Veterinarian.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Veterinarian.prototype, "specialite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'telephone', length: 50, nullable: true }),
    __metadata("design:type", String)
], Veterinarian.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Veterinarian.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'adresse', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Veterinarian.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Veterinarian.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Veterinarian.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Veterinarian.prototype, "updatedAt", void 0);
exports.Veterinarian = Veterinarian = __decorate([
    (0, typeorm_1.Entity)('veterinarians')
], Veterinarian);
//# sourceMappingURL=veterinarian.entity.js.map