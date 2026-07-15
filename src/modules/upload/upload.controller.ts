import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';

@ApiTags('Farm - Upload')
@ApiBearerAuth()
@Controller('farm/upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post()
    @ApiOperation({ summary: 'Upload an image' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    })
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!file) {
            throw new BadRequestException('No file provided');
        }
        if (!allowed.includes(file.mimetype)) {
            throw new BadRequestException('Invalid file type');
        }

        const result = await this.uploadService.uploadImage(file);
        return {
            url: result.secure_url,
            public_id: result.public_id,
        };
    }
}
