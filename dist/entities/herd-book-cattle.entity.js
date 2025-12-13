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
exports.HerdBookCattle = void 0;
const typeorm_1 = require("typeorm");
const cattle_entity_1 = require("./cattle.entity");
const herd_book_entity_1 = require("./herd-book.entity");
let HerdBookCattle = class HerdBookCattle {
};
exports.HerdBookCattle = HerdBookCattle;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 36 }),
    __metadata("design:type", String)
], HerdBookCattle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'herd_book_id', length: 36 }),
    __metadata("design:type", String)
], HerdBookCattle.prototype, "herdBookId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => herd_book_entity_1.HerdBook),
    (0, typeorm_1.JoinColumn)({ name: 'herd_book_id' }),
    __metadata("design:type", herd_book_entity_1.HerdBook)
], HerdBookCattle.prototype, "herdBook", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cattle_id', length: 36 }),
    __metadata("design:type", String)
], HerdBookCattle.prototype, "cattleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cattle_entity_1.Cattle, (cattle) => cattle.herdBookEntries, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'cattle_id' }),
    __metadata("design:type", cattle_entity_1.Cattle)
], HerdBookCattle.prototype, "cattle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'n_carnet', length: 50, nullable: true }),
    __metadata("design:type", String)
], HerdBookCattle.prototype, "nCarnet", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id', length: 50 }),
    __metadata("design:type", String)
], HerdBookCattle.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Category'),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", Object)
], HerdBookCattle.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'status_id', length: 50 }),
    __metadata("design:type", String)
], HerdBookCattle.prototype, "statusId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)('Status'),
    (0, typeorm_1.JoinColumn)({ name: 'status_id' }),
    __metadata("design:type", Object)
], HerdBookCattle.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], HerdBookCattle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], HerdBookCattle.prototype, "updatedAt", void 0);
exports.HerdBookCattle = HerdBookCattle = __decorate([
    (0, typeorm_1.Entity)('herd_book_cattle')
], HerdBookCattle);
//# sourceMappingURL=herd-book-cattle.entity.js.map