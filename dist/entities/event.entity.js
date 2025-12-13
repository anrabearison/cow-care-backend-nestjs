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
exports.Event = void 0;
const typeorm_1 = require("typeorm");
const cattle_entity_1 = require("./cattle.entity");
const event_type_entity_1 = require("./event-type.entity");
let Event = class Event {
};
exports.Event = Event;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 36 }),
    __metadata("design:type", String)
], Event.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cattle_id', length: 36 }),
    __metadata("design:type", String)
], Event.prototype, "cattleId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cattle_entity_1.Cattle, (cattle) => cattle.events, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'cattle_id' }),
    __metadata("design:type", cattle_entity_1.Cattle)
], Event.prototype, "cattle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type_id', length: 50 }),
    __metadata("design:type", String)
], Event.prototype, "eventTypeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => event_type_entity_1.EventType),
    (0, typeorm_1.JoinColumn)({ name: 'event_type_id' }),
    __metadata("design:type", event_type_entity_1.EventType)
], Event.prototype, "eventType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Event.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Event.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Event.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Event.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Event.prototype, "updatedAt", void 0);
exports.Event = Event = __decorate([
    (0, typeorm_1.Entity)('events')
], Event);
//# sourceMappingURL=event.entity.js.map