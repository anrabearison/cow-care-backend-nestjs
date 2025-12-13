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
exports.EventsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const event_entity_1 = require("../../entities/event.entity");
let EventsService = class EventsService {
    constructor(eventsRepository) {
        this.eventsRepository = eventsRepository;
    }
    async findAll(query, user) {
        const { page = 1, per_page = 10, sort = 'date', order = 'DESC', cattle_id, event_type_id } = query;
        const skip = (page - 1) * per_page;
        const qb = this.eventsRepository.createQueryBuilder('event')
            .leftJoinAndSelect('event.cattle', 'cattle')
            .leftJoinAndSelect('event.eventType', 'eventType');
        if (cattle_id) {
            qb.andWhere('event.cattleId = :cattleId', { cattleId: cattle_id });
        }
        if (event_type_id) {
            qb.andWhere('event.eventTypeId = :eventTypeId', { eventTypeId: event_type_id });
        }
        qb.orderBy(`event.${sort}`, order);
        qb.skip(skip).take(per_page);
        const [rawData, total] = await qb.getManyAndCount();
        const data = rawData.map(event => (Object.assign(Object.assign({}, event), { type: event.eventTypeId })));
        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }
    async findOne(id, user) {
        const event = await this.eventsRepository.findOne({
            where: { id },
            relations: ['cattle', 'eventType']
        });
        if (!event) {
            throw new common_1.NotFoundException(`Event with ID ${id} not found`);
        }
        return event;
    }
    async create(createEventDto, user) {
        const event = this.eventsRepository.create(Object.assign(Object.assign({}, createEventDto), { id: crypto.randomUUID() }));
        await this.eventsRepository.save(event);
        return this.findOne(event.id, user);
    }
    async update(id, updateEventDto, user) {
        const event = await this.findOne(id, user);
        Object.assign(event, updateEventDto);
        await this.eventsRepository.save(event);
        return this.findOne(id, user);
    }
    async remove(id, user) {
        const event = await this.findOne(id, user);
        await this.eventsRepository.remove(event);
        return event;
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(event_entity_1.Event)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], EventsService);
//# sourceMappingURL=events.service.js.map