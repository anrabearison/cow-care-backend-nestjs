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
exports.Medicament = void 0;
const typeorm_1 = require("typeorm");
let Medicament = class Medicament {
};
exports.Medicament = Medicament;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 50 }),
    __metadata("design:type", String)
], Medicament.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'nom', length: 255 }),
    __metadata("design:type", String)
], Medicament.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Medicament.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_quantite', type: 'numeric', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Medicament.prototype, "dosageQuantite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_unite', nullable: true }),
    __metadata("design:type", String)
], Medicament.prototype, "dosageUnite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_poids', type: 'numeric', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Medicament.prototype, "dosagePoids", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_unite_poids', length: 20, nullable: true }),
    __metadata("design:type", String)
], Medicament.prototype, "dosageUnitePoids", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Medicament.prototype, "dosageNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'default_route', nullable: true }),
    __metadata("design:type", String)
], Medicament.prototype, "defaultRoute", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'withdrawal_period_meat', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Medicament.prototype, "withdrawalPeriodMeat", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'withdrawal_period_milk', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Medicament.prototype, "withdrawalPeriodMilk", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_recommande_old', length: 255, nullable: true }),
    __metadata("design:type", String)
], Medicament.prototype, "dosageRecommandeOld", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Medicament.prototype, "fabricant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Medicament.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Medicament.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Medicament.prototype, "updatedAt", void 0);
exports.Medicament = Medicament = __decorate([
    (0, typeorm_1.Entity)('medicaments')
], Medicament);
//# sourceMappingURL=medicament.entity.js.map