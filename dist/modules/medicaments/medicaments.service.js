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
exports.MedicamentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const medicament_entity_1 = require("../../entities/medicament.entity");
let MedicamentsService = class MedicamentsService {
    constructor(medicamentsRepository) {
        this.medicamentsRepository = medicamentsRepository;
    }
    async findAll() {
        return this.medicamentsRepository.find();
    }
    async findOne(id) {
        const medicament = await this.medicamentsRepository.findOne({ where: { id } });
        if (!medicament) {
            throw new common_1.NotFoundException(`Medicament with ID ${id} not found`);
        }
        return medicament;
    }
    async create(createMedicamentDto) {
        const medicament = this.medicamentsRepository.create(createMedicamentDto);
        return this.medicamentsRepository.save(medicament);
    }
    async update(id, updateMedicamentDto) {
        const medicament = await this.findOne(id);
        Object.assign(medicament, updateMedicamentDto);
        return this.medicamentsRepository.save(medicament);
    }
    async remove(id) {
        const medicament = await this.findOne(id);
        await this.medicamentsRepository.remove(medicament);
    }
};
exports.MedicamentsService = MedicamentsService;
exports.MedicamentsService = MedicamentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(medicament_entity_1.Medicament)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MedicamentsService);
//# sourceMappingURL=medicaments.service.js.map