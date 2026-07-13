import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';
import { Owner } from '../../owners/entities/owner.entity';

/**
 * User information returned in the login response
 */
export class LoginUserDto {
    @ApiProperty({ example: 'uuid-1234' })
    id: string;

    @ApiProperty({ example: 'Alice' })
    name: string;

    @ApiProperty({ example: 'alice@example.com' })
    email: string;

    @ApiProperty({ enum: UserRole, example: UserRole.OWNER_USER })
    role: UserRole;

    @ApiProperty({ example: 'owner-uuid', required: false })
    ownerId?: string;

    @ApiProperty({ type: () => Owner, required: false })
    owner?: Owner;

    @ApiProperty({ example: true })
    isActive: boolean;

    @ApiProperty({ example: '2024-01-01T00:00:00Z' })
    createdAt: Date;

    @ApiProperty({ example: '2024-01-01T00:00:00Z' })
    updatedAt: Date;
}

/**
 * Login response DTO
 *
 * TODO: Remove `access_token` and `token_type` fields once all clients
 * have migrated to HttpOnly cookie authentication. The JWT will then
 * only be delivered via the Set-Cookie header.
 */
export class LoginResponseDto {
    @ApiProperty({
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'JWT access token. DEPRECATED: temporarily kept for backward compatibility. '
            + 'Will be removed once all clients migrate to HttpOnly cookie authentication.',
    })
    access_token: string;

    @ApiProperty({ example: 'Bearer', description: 'Token type (always Bearer)' })
    token_type: string;

    @ApiProperty({ type: LoginUserDto, description: 'Authenticated user information' })
    user: LoginUserDto;
}
