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
exports.Treatment = exports.AdministrationRoute = exports.DosageUnit = exports.TreatmentType = void 0;
const typeorm_1 = require("typeorm");
const cattle_entity_1 = require("./cattle.entity");
const medicament_entity_1 = require("./medicament.entity");
const veterinarian_entity_1 = require("./veterinarian.entity");
var TreatmentType;
(function (TreatmentType) {
    TreatmentType["ANTIBIOTIQUE"] = "ANTIBIOTIQUE";
    TreatmentType["VACCIN"] = "VACCIN";
    TreatmentType["VERMIFUGE"] = "VERMIFUGE";
    TreatmentType["ANTI_INFLAMMATOIRE"] = "ANTI_INFLAMMATOIRE";
    TreatmentType["VITAMINE"] = "VITAMINE";
    TreatmentType["AUTRE"] = "AUTRE";
})(TreatmentType || (exports.TreatmentType = TreatmentType = {}));
var DosageUnit;
(function (DosageUnit) {
    DosageUnit["ML"] = "ML";
    DosageUnit["L"] = "L";
    DosageUnit["MG"] = "MG";
    DosageUnit["G"] = "G";
    DosageUnit["KG"] = "KG";
    DosageUnit["COMPRIME"] = "COMPRIME";
    DosageUnit["BOLUS"] = "BOLUS";
    DosageUnit["DOSE"] = "DOSE";
    DosageUnit["UI"] = "UI";
})(DosageUnit || (exports.DosageUnit = DosageUnit = {}));
var AdministrationRoute;
(function (AdministrationRoute) {
    AdministrationRoute["IM"] = "IM";
    AdministrationRoute["SC"] = "SC";
    AdministrationRoute["IV"] = "IV";
    AdministrationRoute["ORAL"] = "ORAL";
    AdministrationRoute["TOPICAL"] = "TOPICAL";
    AdministrationRoute["INTRAMAMMARY"] = "INTRAMAMMARY";
    AdministrationRoute["INHALATION"] = "INHALATION";
    AdministrationRoute["OTHER"] = "OTHER";
})(AdministrationRoute || (exports.AdministrationRoute = AdministrationRoute = {}));
let Treatment = class Treatment {
};
exports.Treatment = Treatment;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 36 }),
    __metadata("design:type", String)
], Treatment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cattle_id', length: 36 }),
    __metadata("design:type", String)
], Treatment.prototype, "cattleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cattle_entity_1.Cattle, (cattle) => cattle.treatments, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'cattle_id' }),
    __metadata("design:type", cattle_entity_1.Cattle)
], Treatment.prototype, "cattle", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: TreatmentType }),
    __metadata("design:type", String)
], Treatment.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Treatment.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'medicament_id', length: 50 }),
    __metadata("design:type", String)
], Treatment.prototype, "medicamentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => medicament_entity_1.Medicament),
    (0, typeorm_1.JoinColumn)({ name: 'medicament_id' }),
    __metadata("design:type", medicament_entity_1.Medicament)
], Treatment.prototype, "medicament", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_quantite', type: 'numeric', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Treatment.prototype, "dosageQuantite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_unite', type: 'enum', enum: DosageUnit, nullable: true }),
    __metadata("design:type", String)
], Treatment.prototype, "dosageUnite", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'animal_poids', type: 'numeric', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Treatment.prototype, "animalPoids", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Treatment.prototype, "dosageNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'administration_route', type: 'enum', enum: AdministrationRoute, default: AdministrationRoute.IM }),
    __metadata("design:type", String)
], Treatment.prototype, "administrationRoute", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'withdrawal_end_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Treatment.prototype, "withdrawalEndDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dosage_old', length: 100, nullable: true }),
    __metadata("design:type", String)
], Treatment.prototype, "dosageOld", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'veterinarian_id', length: 50 }),
    __metadata("design:type", String)
], Treatment.prototype, "veterinarianId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => veterinarian_entity_1.Veterinarian),
    (0, typeorm_1.JoinColumn)({ name: 'veterinarian_id' }),
    __metadata("design:type", veterinarian_entity_1.Veterinarian)
], Treatment.prototype, "veterinarian", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Treatment.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Treatment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Treatment.prototype, "updatedAt", void 0);
exports.Treatment = Treatment = __decorate([
    (0, typeorm_1.Entity)('treatments')
], Treatment);
//# sourceMappingURL=treatment.entity.js.map