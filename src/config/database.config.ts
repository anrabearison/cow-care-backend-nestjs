import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
    return {
        type: 'postgres',
        url: configService.get<string>('database.url'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        synchronize: true, // Auto-create schema for dev
        logging: configService.get<boolean>('database.echo'),
        autoLoadEntities: true,
    };
};
