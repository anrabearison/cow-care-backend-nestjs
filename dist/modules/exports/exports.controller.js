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
exports.ExportsController = void 0;
const common_1 = require("@nestjs/common");
const exports_service_1 = require("./exports.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let ExportsController = class ExportsController {
    constructor(exportsService) {
        this.exportsService = exportsService;
    }
    async exportExcel(type, res) {
        const data = [];
        const columns = [];
        return this.exportsService.exportToExcel(data, columns, res);
    }
    async exportPdf(type, res) {
        const data = [];
        return this.exportsService.exportToPdf(data, res);
    }
};
exports.ExportsController = ExportsController;
__decorate([
    (0, common_1.Get)('excel'),
    (0, swagger_1.ApiOperation)({ summary: 'Export data to Excel' }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportExcel", null);
__decorate([
    (0, common_1.Get)('pdf'),
    (0, swagger_1.ApiOperation)({ summary: 'Export data to PDF' }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExportsController.prototype, "exportPdf", null);
exports.ExportsController = ExportsController = __decorate([
    (0, swagger_1.ApiTags)('exports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/v1/exports'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [exports_service_1.ExportsService])
], ExportsController);
//# sourceMappingURL=exports.controller.js.map