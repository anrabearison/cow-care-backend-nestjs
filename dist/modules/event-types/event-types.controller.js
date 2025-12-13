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
exports.EventTypesController = void 0;
const common_1 = require("@nestjs/common");
const event_types_service_1 = require("./event-types.service");
const create_event_type_dto_1 = require("./dto/create-event-type.dto");
let EventTypesController = class EventTypesController {
    constructor(eventTypesService) {
        this.eventTypesService = eventTypesService;
    }
    async findAll(res) {
        const eventTypes = await this.eventTypesService.findAll();
        res.set('X-Total-Count', eventTypes.length.toString());
        res.set('Access-Control-Expose-Headers', 'X-Total-Count');
        return res.json(eventTypes);
    }
    findOne(id) {
        return this.eventTypesService.findOne(id);
    }
    create(createEventTypeDto) {
        return this.eventTypesService.create(createEventTypeDto);
    }
    update(id, updateEventTypeDto) {
        return this.eventTypesService.update(id, updateEventTypeDto);
    }
    remove(id) {
        return this.eventTypesService.remove(id);
    }
};
exports.EventTypesController = EventTypesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EventTypesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_event_type_dto_1.CreateEventTypeDto]),
    __metadata("design:returntype", void 0)
], EventTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_event_type_dto_1.UpdateEventTypeDto]),
    __metadata("design:returntype", void 0)
], EventTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EventTypesController.prototype, "remove", null);
exports.EventTypesController = EventTypesController = __decorate([
    (0, common_1.Controller)('api/v1/event-types'),
    __metadata("design:paramtypes", [event_types_service_1.EventTypesService])
], EventTypesController);
//# sourceMappingURL=event-types.controller.js.map