"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeOrmConfig = void 0;
const getTypeOrmConfig = (configService) => {
    return {
        type: 'postgres',
        url: configService.get('database.url'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: configService.get('database.echo'),
        autoLoadEntities: true,
    };
};
exports.getTypeOrmConfig = getTypeOrmConfig;
//# sourceMappingURL=database.config.js.map