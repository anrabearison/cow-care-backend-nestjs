import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { CloudinaryProvider } from './cloudinary.provider';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        MulterModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                limits: {
                    fileSize: configService.get<number>('upload.maxSize') || 5 * 1024 * 1024,
                },
            }),
        }),
    ],
    controllers: [UploadController],
    providers: [UploadService, CloudinaryProvider],
    exports: [UploadService],
})
export class UploadModule { }
