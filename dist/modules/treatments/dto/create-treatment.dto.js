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
exports.CreateTreatmentDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const treatment_entity_1 = require("../../../entities/treatment.entity");
class TreatmentDosageDto {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], TreatmentDosageDto.prototype, "quantite", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: treatment_entity_1.DosageUnit }),
    (0, class_validator_1.IsEnum)(treatment_entity_1.DosageUnit),
    __metadata("design:type", String)
], TreatmentDosageDto.prototype, "unite", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], TreatmentDosageDto.prototype, "animal_poids", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], TreatmentDosageDto.prototype, "notes", void 0);
class CreateTreatmentDto {
}
exports.CreateTreatmentDto = CreateTreatmentDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "cattleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: treatment_entity_1.TreatmentType }),
    (0, class_validator_1.IsEnum)(treatment_entity_1.TreatmentType),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateTreatmentDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "product", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TreatmentDosageDto),
    __metadata("design:type", TreatmentDosageDto)
], CreateTreatmentDto.prototype, "dosage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: treatment_entity_1.AdministrationRoute, default: treatment_entity_1.AdministrationRoute.IM }),
    (0, class_validator_1.IsEnum)(treatment_entity_1.AdministrationRoute),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "administration_route", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "veterinarian", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTreatmentDto.prototype, "notes", void 0);
//# sourceMappingURL=create-treatment.dto.js.map