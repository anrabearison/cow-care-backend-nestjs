import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository, UsersFilters } from './users.repository';
import { UsersMapper } from './users.mapper';
import * as crypto from 'crypto';
import { EmailService } from '../../../common/services/email.service';

// Error messages constants
const ERROR_MESSAGES = {
  USER_NOT_FOUND: (id: string) => `User with ID ${id} not found`,
  NOT_AUTHORIZED: 'Not authorized',
  EMAIL_ALREADY_REGISTERED: 'Email already registered',
  CANNOT_MODIFY_SUPER_ADMIN_ROLE: 'Cannot modify SUPER_ADMIN role',
  CANNOT_ASSIGN_SUPER_ADMIN_ROLE: 'Cannot assign SUPER_ADMIN role',
  CANNOT_MODIFY_OWN_ROLE: 'Cannot modify your own role',
  NOT_AUTHORIZED_MODIFY_ROLE: 'Not authorized to modify role',
  CANNOT_MODIFY_SUPER_ADMIN_ACCOUNT: 'Cannot modify SUPER_ADMIN account',
  CANNOT_DEACTIVATE_OWN_ACCOUNT: 'Cannot deactivate your own account',
  CANNOT_MODIFY_OWN_ACTIVE_STATUS: 'Cannot modify your own active status',
  NOT_AUTHORIZED_MODIFY_ACTIVE_STATUS: 'Not authorized to modify active status',
  USER_MUST_BELONG_OWNER: 'User must belong to an owner',
  OWNER_ID_REQUIRED: 'ownerId is required for non-super-admin user creation',
} as const;

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly emailService: EmailService,
    ) { }

    // ──────────────────────────────────────────────
    //  Private RBAC Helper Methods
    // ──────────────────────────────────────────────

    private canModifyUser(currentUser: User, targetUser: User): boolean {
        return currentUser.role === UserRole.SUPER_ADMIN ||
               targetUser.id === currentUser.id ||
               targetUser.ownerId === currentUser.ownerId;
    }

    private canModifyRole(currentUser: User, targetUser: User, newRole: UserRole): boolean {
        // SUPER_ADMIN can modify any role
        if (currentUser.role === UserRole.SUPER_ADMIN) {
            return true;
        }

        // OWNER_ADMIN can modify roles of users from same owner (but not SUPER_ADMIN)
        if (currentUser.role === UserRole.OWNER_ADMIN && currentUser.ownerId === targetUser.ownerId) {
            // Prevent modifying SUPER_ADMIN users
            if (targetUser.role === UserRole.SUPER_ADMIN) {
                throw new ForbiddenException(ERROR_MESSAGES.CANNOT_MODIFY_SUPER_ADMIN_ROLE);
            }
            // Prevent assigning SUPER_ADMIN role
            if (newRole === UserRole.SUPER_ADMIN) {
                throw new ForbiddenException(ERROR_MESSAGES.CANNOT_ASSIGN_SUPER_ADMIN_ROLE);
            }
            return true;
        }

        // Users cannot modify their own role
        if (targetUser.id === currentUser.id) {
            throw new ForbiddenException(ERROR_MESSAGES.CANNOT_MODIFY_OWN_ROLE);
        }

        throw new ForbiddenException(ERROR_MESSAGES.NOT_AUTHORIZED_MODIFY_ROLE);
    }

    private canModifyActiveStatus(currentUser: User, targetUser: User, newStatus: boolean): boolean {
        // SUPER_ADMIN can activate/deactivate any user
        if (currentUser.role === UserRole.SUPER_ADMIN) {
            return true;
        }

        // OWNER_ADMIN can activate/deactivate users from same owner (but not SUPER_ADMIN)
        if (currentUser.role === UserRole.OWNER_ADMIN && currentUser.ownerId === targetUser.ownerId) {
            // Prevent modifying SUPER_ADMIN users
            if (targetUser.role === UserRole.SUPER_ADMIN) {
                throw new ForbiddenException(ERROR_MESSAGES.CANNOT_MODIFY_SUPER_ADMIN_ACCOUNT);
            }
            // Prevent deactivating themselves
            if (targetUser.id === currentUser.id && newStatus === false) {
                throw new ForbiddenException(ERROR_MESSAGES.CANNOT_DEACTIVATE_OWN_ACCOUNT);
            }
            return true;
        }

        // Users cannot modify their own isActive status
        if (targetUser.id === currentUser.id) {
            throw new ForbiddenException(ERROR_MESSAGES.CANNOT_MODIFY_OWN_ACTIVE_STATUS);
        }

        throw new ForbiddenException(ERROR_MESSAGES.NOT_AUTHORIZED_MODIFY_ACTIVE_STATUS);
    }

    // ──────────────────────────────────────────────
    //  Public Methods
    // ──────────────────────────────────────────────

    async findAll(query: any, currentUser: User) {
        if (currentUser.role === UserRole.OWNER_USER) {
            throw new ForbiddenException(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        const filters: UsersFilters = {
            ...query,
        };

        if (currentUser.role !== UserRole.SUPER_ADMIN) {
            if (!currentUser.ownerId) {
                throw new ForbiddenException(ERROR_MESSAGES.USER_MUST_BELONG_OWNER);
            }
            filters.ownerId = currentUser.ownerId;
            filters.excludeRole = UserRole.SUPER_ADMIN;
        }

        const result = await this.usersRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: UsersMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, currentUser: User) {
        const user = await this.usersRepository.findOne({ 
            where: { id },
            relations: ['owner']
        });

        if (!user) {
            throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND(id));
        }

        if (!this.canModifyUser(currentUser, user)) {
            throw new ForbiddenException(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        return UsersMapper.toResponse(user);
    }

    async create(createUserDto: CreateUserDto, currentUser: User) {
        // Force role and ownerId based on caller's role - never trust payload
        let effectiveRole = createUserDto.role;
        let effectiveOwnerId = createUserDto.ownerId;

        if (currentUser.role === UserRole.OWNER_ADMIN) {
            // OWNER_ADMIN can only create OWNER_USER accounts for their own owner
            effectiveRole = UserRole.OWNER_USER;
            effectiveOwnerId = currentUser.ownerId;
        } else if (currentUser.role === UserRole.SUPER_ADMIN) {
            // SUPER_ADMIN can create any role/ownerId
            effectiveRole = createUserDto.role;
            effectiveOwnerId = createUserDto.ownerId;
        } else {
            // Other roles cannot create users
            throw new ForbiddenException(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        if (effectiveRole !== UserRole.SUPER_ADMIN && !effectiveOwnerId) {
            throw new BadRequestException(ERROR_MESSAGES.OWNER_ID_REQUIRED);
        }

        const existingUser = await this.usersRepository.findOne({
            where: { email: createUserDto.email }
        });

        if (existingUser) {
            throw new BadRequestException(ERROR_MESSAGES.EMAIL_ALREADY_REGISTERED);
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const newUser = this.usersRepository.create({
            ...createUserDto,
            role: effectiveRole,
            ownerId: effectiveOwnerId,
            id: crypto.randomUUID(),
            hashedPassword,
        } as any) as unknown as User;

        await this.usersRepository.save(newUser);

        // Send email with credentials asynchronously (fire & forget)
        setImmediate(async () => {
            try {
                await this.emailService.sendUserCreationEmail(
                    newUser.email,
                    createUserDto.password,
                );
            } catch (err: any) {
                // Log error but don't fail the user creation
                console.error('Failed to send user creation email:', err?.message ?? err);
            }
        });

        return UsersMapper.toResponse(newUser);
    }

    async update(id: string, updateUserDto: UpdateUserDto, currentUser: User) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND(id));
        }

        // RBAC Check for basic access
        if (!this.canModifyUser(currentUser, user)) {
            throw new ForbiddenException(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        // Validate role modification if role is being changed
        if (updateUserDto.role !== undefined) {
            this.canModifyRole(currentUser, user, updateUserDto.role);
        }

        // Validate isActive modification if isActive is being changed
        if (updateUserDto.isActive !== undefined) {
            this.canModifyActiveStatus(currentUser, user, updateUserDto.isActive);
        }

        // Hash password if provided
        if (updateUserDto.password) {
            updateUserDto.hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
            delete updateUserDto.password;
        }

        // Apply updates safely
        const allowedUpdates = ['name', 'email', 'role', 'isActive', 'hashedPassword', 'ownerId'];
        allowedUpdates.forEach(field => {
            if (updateUserDto[field as keyof UpdateUserDto] !== undefined) {
                (user as any)[field] = updateUserDto[field as keyof UpdateUserDto];
            }
        });

        await this.usersRepository.save(user);
        return this.findOne(id, currentUser);
    }

    async remove(id: string, currentUser: User) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND(id));
        }

        // RBAC Check
        if (!this.canModifyUser(currentUser, user)) {
            throw new ForbiddenException(ERROR_MESSAGES.NOT_AUTHORIZED);
        }

        // Soft delete - deactivate user instead of deleting
        user.isActive = false;
        await this.usersRepository.save(user);
        
        return UsersMapper.toResponse(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email }, relations: ['owner'] });
    }
}
