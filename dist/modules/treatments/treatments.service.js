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
exports.TreatmentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const treatment_entity_1 = require("../../entities/treatment.entity");
let TreatmentsService = class TreatmentsService {
    constructor(treatmentsRepository) {
        this.treatmentsRepository = treatmentsRepository;
    }
    async findAll(query, user) {
        const { page = 1, per_page = 10, sort = 'date', order = 'DESC', cattle_id, type } = query;
        const skip = (page - 1) * per_page;
        const qb = this.treatmentsRepository.createQueryBuilder('treatment')
            .leftJoinAndSelect('treatment.cattle', 'cattle')
            .leftJoinAndSelect('treatment.medicament', 'medicament')
            .leftJoinAndSelect('treatment.veterinarian', 'veterinarian');
        if (cattle_id) {
            qb.andWhere('treatment.cattleId = :cattleId', { cattleId: cattle_id });
        }
        if (type) {
            qb.andWhere('treatment.type = :type', { type });
        }
        qb.orderBy(`treatment.${sort}`, order);
        qb.skip(skip).take(per_page);
        const [data, total] = await qb.getManyAndCount();
        const mappedData = data.map(item => (Object.assign(Object.assign({}, item), { product: item.medicamentId, veterinarian: item.veterinarianId, dosage: {
                quantite: item.dosageQuantite,
                unite: item.dosageUnite,
                animal_poids: item.animalPoids,
                notes: item.dosageNotes
            } })));
        return {
            data: mappedData,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }
    async findOne(id, user) {
        const treatment = await this.treatmentsRepository.findOne({
            where: { id },
            relations: ['cattle', 'medicament', 'veterinarian']
        });
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with ID ${id} not found`);
        }
        return Object.assign(Object.assign({}, treatment), { product: treatment.medicamentId, veterinarian: treatment.veterinarianId, dosage: {
                quantite: treatment.dosageQuantite,
                unite: treatment.dosageUnite,
                animal_poids: treatment.animalPoids,
                notes: treatment.dosageNotes
            } });
    }
    async create(createTreatmentDto, user) {
        const treatment = this.treatmentsRepository.create({
            id: crypto.randomUUID(),
            cattleId: createTreatmentDto.cattleId,
            type: createTreatmentDto.type,
            date: createTreatmentDto.date,
            medicamentId: createTreatmentDto.product,
            veterinarianId: createTreatmentDto.veterinarian,
            notes: createTreatmentDto.notes,
            administrationRoute: createTreatmentDto.administration_route,
            dosageQuantite: createTreatmentDto.dosage.quantite,
            dosageUnite: createTreatmentDto.dosage.unite,
            animalPoids: createTreatmentDto.dosage.animal_poids,
            dosageNotes: createTreatmentDto.dosage.notes,
        });
        await this.treatmentsRepository.save(treatment);
        return this.findOne(treatment.id, user);
    }
    async update(id, updateTreatmentDto, user) {
        const treatment = await this.treatmentsRepository.findOne({ where: { id } });
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with ID ${id} not found`);
        }
        if (updateTreatmentDto.dosage) {
            treatment.dosageQuantite = updateTreatmentDto.dosage.quantite;
            treatment.dosageUnite = updateTreatmentDto.dosage.unite;
            treatment.animalPoids = updateTreatmentDto.dosage.animal_poids;
            treatment.dosageNotes = updateTreatmentDto.dosage.notes;
        }
        Object.assign(treatment, updateTreatmentDto);
        delete treatment.dosage;
        await this.treatmentsRepository.save(treatment);
        return this.findOne(id, user);
    }
    async remove(id, user) {
        const treatment = await this.treatmentsRepository.findOne({ where: { id } });
        if (!treatment) {
            throw new common_1.NotFoundException(`Treatment with ID ${id} not found`);
        }
        await this.treatmentsRepository.remove(treatment);
        return treatment;
    }
};
exports.TreatmentsService = TreatmentsService;
exports.TreatmentsService = TreatmentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(treatment_entity_1.Treatment)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TreatmentsService);
//# sourceMappingURL=treatments.service.js.map