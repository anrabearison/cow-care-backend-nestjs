import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class UploadService {
    constructor(private configService: ConfigService) { }

    async uploadImage(file: Express.Multer.File): Promise<any> {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: this.configService.get<string>('cloudinary.folder'),
                    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                },
            );

            const stream = new Readable();
            stream.push(file.buffer);
            stream.push(null);
            stream.pipe(uploadStream);
        });
    }
}
