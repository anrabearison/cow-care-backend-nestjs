import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProviderType } from '../entities/auth-provider.entity';

export class GoogleOAuthCallbackDto {
    @ApiProperty({ example: 'authorization-code-from-google' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ example: 'state-parameter', required: false })
    @IsString()
    state?: string;
}

export class LinkProviderDto {
    @ApiProperty({ example: 'authorization-code-from-google' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ enum: AuthProviderType, example: AuthProviderType.GOOGLE })
    @IsEnum(AuthProviderType)
    @IsNotEmpty()
    provider: AuthProviderType;
}
