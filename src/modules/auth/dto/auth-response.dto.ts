import { ApiProperty } from '@nestjs/swagger';
import { AuthProviderType } from '../entities/auth-provider.entity';

export class ProviderInfoDto {
    @ApiProperty({ enum: AuthProviderType, example: AuthProviderType.GOOGLE })
    provider: AuthProviderType;

    @ApiProperty({ example: true })
    linked: boolean;

    @ApiProperty({ example: 'google-sub-id', required: false })
    providerUserId?: string;

    @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
    lastLoginAt?: Date;
}
