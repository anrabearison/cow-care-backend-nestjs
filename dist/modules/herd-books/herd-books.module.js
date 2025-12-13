"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HerdBooksModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const herd_books_service_1 = require("./herd-books.service");
const herd_books_controller_1 = require("./herd-books.controller");
const herd_book_entity_1 = require("../../entities/herd-book.entity");
let HerdBooksModule = class HerdBooksModule {
};
exports.HerdBooksModule = HerdBooksModule;
exports.HerdBooksModule = HerdBooksModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([herd_book_entity_1.HerdBook])],
        controllers: [herd_books_controller_1.HerdBooksController],
        providers: [herd_books_service_1.HerdBooksService],
        exports: [herd_books_service_1.HerdBooksService],
    })
], HerdBooksModule);
//# sourceMappingURL=herd-books.module.js.map