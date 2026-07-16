import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../platform/users/entities/user.entity';
import { Owner } from '../../platform/owners/entities/owner.entity';

/**
 * Current User Session DTO
 * 
 * Represents the authenticated user associated with the current session.
 * Strictly filters out any sensitive information (e.g. password, tokens, secrets).
 */
export class CurrentUserDto {
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
