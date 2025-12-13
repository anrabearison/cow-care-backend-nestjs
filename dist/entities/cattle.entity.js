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
exports.Cattle = exports.SourceType = exports.Gender = void 0;
const typeorm_1 = require("typeorm");
const character_entity_1 = require("./character.entity");
const event_entity_1 = require("./event.entity");
const treatment_entity_1 = require("./treatment.entity");
const herd_book_cattle_entity_1 = require("./herd-book-cattle.entity");
var Gender;
(function (Gender) {
    Gender["M"] = "M";
    Gender["F"] = "F";
})(Gender || (exports.Gender = Gender = {}));
var SourceType;
(function (SourceType) {
    SourceType["ACHETE"] = "ACHETE";
    SourceType["NE_DANS_TROUPEAU"] = "NE_DANS_TROUPEAU";
})(SourceType || (exports.SourceType = SourceType = {}));
let Cattle = class Cattle {
    get source() {
        return {
            type: this.sourceType,
            supplier: this.sourceSupplier,
            purchaseDate: this.sourcePurchaseDate,
            purchasePrice: this.sourcePurchasePrice,
            purchaseWeight: this.sourcePurchaseWeight,
            purchaseHealthStatus: this.sourcePurchaseHealthStatus,
            purchaseNotes: this.sourcePurchaseNotes,
            motherId: this.sourceMotherId,
        };
    }
};
exports.Cattle = Cattle;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 36 }),
    __metadata("design:type", String)
], Cattle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Cattle.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], Cattle.prototype, "nickname", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: Gender }),
    __metadata("design:type", String)
], Cattle.prototype, "gender", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'birth_date', type: 'date' }),
    __metadata("design:type", Date)
], Cattle.prototype, "birthDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'character_id', length: 50, nullable: true }),
    __metadata("design:type", String)
], Cattle.prototype, "characterId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => character_entity_1.Character, (character) => character.cattle),
    (0, typeorm_1.JoinColumn)({ name: 'character_id' }),
    __metadata("design:type", character_entity_1.Character)
], Cattle.prototype, "character", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Cattle.prototype, "brand", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'distinctive_sign', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Cattle.prototype, "distinctiveSign", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], Cattle.prototype, "photo", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_type', type: 'enum', enum: SourceType }),
    __metadata("design:type", String)
], Cattle.prototype, "sourceType", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_supplier', length: 255, nullable: true }),
    __metadata("design:type", String)
], Cattle.prototype, "sourceSupplier", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_purchase_date', type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Cattle.prototype, "sourcePurchaseDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_purchase_price', type: 'numeric', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Cattle.prototype, "sourcePurchasePrice", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_purchase_weight', type: 'numeric', precision: 8, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Cattle.prototype, "sourcePurchaseWeight", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_purchase_health_status', length: 255, nullable: true }),
    __metadata("design:type", String)
], Cattle.prototype, "sourcePurchaseHealthStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_purchase_notes', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Cattle.prototype, "sourcePurchaseNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'source_mother_id', length: 36, nullable: true }),
    __metadata("design:type", String)
], Cattle.prototype, "sourceMotherId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Cattle, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'source_mother_id' }),
    __metadata("design:type", Cattle)
], Cattle.prototype, "mother", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => event_entity_1.Event, (event) => event.cattle),
    __metadata("design:type", Array)
], Cattle.prototype, "events", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => treatment_entity_1.Treatment, (treatment) => treatment.cattle),
    __metadata("design:type", Array)
], Cattle.prototype, "treatments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => herd_book_cattle_entity_1.HerdBookCattle, (entry) => entry.cattle),
    __metadata("design:type", Array)
], Cattle.prototype, "herdBookEntries", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Cattle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Cattle.prototype, "updatedAt", void 0);
exports.Cattle = Cattle = __decorate([
    (0, typeorm_1.Entity)('cattle')
], Cattle);
//# sourceMappingURL=cattle.entity.js.map