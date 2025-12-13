"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const configuration_1 = __importDefault(require("./config/configuration"));
const database_config_1 = require("./config/database.config");
const auth_module_1 = require("./modules/auth/auth.module");
const cattle_module_1 = require("./modules/cattle/cattle.module");
const events_module_1 = require("./modules/events/events.module");
const treatments_module_1 = require("./modules/treatments/treatments.module");
const users_module_1 = require("./modules/users/users.module");
const owners_module_1 = require("./modules/owners/owners.module");
const upload_module_1 = require("./modules/upload/upload.module");
const exports_module_1 = require("./modules/exports/exports.module");
const categories_module_1 = require("./modules/categories/categories.module");
const status_module_1 = require("./modules/status/status.module");
const characters_module_1 = require("./modules/characters/characters.module");
const event_types_module_1 = require("./modules/event-types/event-types.module");
const medicaments_module_1 = require("./modules/medicaments/medicaments.module");
const veterinarians_module_1 = require("./modules/veterinarians/veterinarians.module");
const herd_books_module_1 = require("./modules/herd-books/herd-books.module");
const herd_book_cattle_module_1 = require("./modules/herd-book-cattle/herd-book-cattle.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => (0, database_config_1.getTypeOrmConfig)(configService),
                inject: [config_1.ConfigService],
            }),
            auth_module_1.AuthModule,
            cattle_module_1.CattleModule,
            events_module_1.EventsModule,
            treatments_module_1.TreatmentsModule,
            users_module_1.UsersModule,
            owners_module_1.OwnersModule,
            upload_module_1.UploadModule,
            exports_module_1.ExportsModule,
            categories_module_1.CategoriesModule,
            status_module_1.StatusModule,
            characters_module_1.CharactersModule,
            event_types_module_1.EventTypesModule,
            medicaments_module_1.MedicamentsModule,
            veterinarians_module_1.VeterinariansModule,
            herd_books_module_1.HerdBooksModule,
            herd_book_cattle_module_1.HerdBookCattleModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map