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
exports.VeterinariansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const veterinarian_entity_1 = require("../../entities/veterinarian.entity");
let VeterinariansService = class VeterinariansService {
    constructor(veterinariansRepository) {
        this.veterinariansRepository = veterinariansRepository;
    }
    async findAll() {
        return this.veterinariansRepository.find();
    }
    async findOne(id) {
        const veterinarian = await this.veterinariansRepository.findOne({ where: { id } });
        if (!veterinarian) {
            throw new common_1.NotFoundException(`Veterinarian with ID ${id} not found`);
        }
        return veterinarian;
    }
    async create(createVeterinarianDto) {
        const veterinarian = this.veterinariansRepository.create(createVeterinarianDto);
        return this.veterinariansRepository.save(veterinarian);
    }
    async update(id, updateVeterinarianDto) {
        const veterinarian = await this.findOne(id);
        Object.assign(veterinarian, updateVeterinarianDto);
        return this.veterinariansRepository.save(veterinarian);
    }
    async remove(id) {
        const veterinarian = await this.findOne(id);
        await this.veterinariansRepository.remove(veterinarian);
    }
};
exports.VeterinariansService = VeterinariansService;
exports.VeterinariansService = VeterinariansService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(veterinarian_entity_1.Veterinarian)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], VeterinariansService);
//# sourceMappingURL=veterinarians.service.js.map