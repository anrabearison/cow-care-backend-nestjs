import { PartialType } from '@nestjs/mapped-types';
import { CreatePassportDto } from './create-passport.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { PassportStatus } from '../entities/passport.entity';

export class UpdatePassportDto extends PartialType(CreatePassportDto) {
    @IsOptional()
    @IsEnum(PassportStatus)
    status?: PassportStatus;
}
