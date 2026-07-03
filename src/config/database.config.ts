import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
    const isDev = configService.get<string>('app.environment') === 'development';
    return {
        type: 'postgres',
        url: configService.get<string>('database.url'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        // IMPORTANT: synchronize must NEVER be true in production — use migrations instead
        synchronize: isDev,
        logging: configService.get<boolean>('database.echo'),
        autoLoadEntities: true,
    };
};
