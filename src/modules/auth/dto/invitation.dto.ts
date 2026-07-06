import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class CreateInvitationDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ enum: UserRole, example: UserRole.OWNER_USER })
    @IsEnum(UserRole)
    @IsNotEmpty()
    role: UserRole;

    @ApiProperty({ example: 'uuid-of-owner', required: false })
    @IsUUID()
    @IsOptional()
    ownerId?: string;
}

export class ValidateInvitationDto {
    @ApiProperty({ example: 'invitation-token-uuid' })
    @IsString()
    @IsNotEmpty()
    token: string;
}
