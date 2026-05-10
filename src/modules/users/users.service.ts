import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository, UsersFilters, UsersPaginationOptions } from './users.repository';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) { }

    async findAll(query: any, currentUser: User) {
        // RBAC: Owner Users cannot list users
        if (currentUser.role === UserRole.OWNER_USER) {
            throw new BadRequestException('Not authorized'); // Using BadRequest to match 403/400 behavior or ForbiddenException if available
        }

        const filters: UsersFilters = {
            ...query,
            currentUserRole: currentUser.role,
            currentUserOwnerId: currentUser.ownerId
        };

        const pagination: UsersPaginationOptions = {
            page: Number(query.page) || 1,
            perPage: Number(query.perPage) || 10,
            sort: query.sort || 'name',
            order: query.order || 'ASC'
        };

        const [data, total] = await this.usersRepository.findAllWithRelations(filters, pagination);

        // Remove password from response
        const safeData = data.map(user => {
            const { hashedPassword, ...result } = user;
            return result;
        });

        return {
            data: safeData,
            total,
            page: pagination.page,
            perPage: pagination.perPage
        };
    }

    async findOne(id: string, currentUser: User) {
        // RBAC: Owner Users can only see themselves
        if (currentUser.role === UserRole.OWNER_USER && currentUser.id !== id) {
            throw new BadRequestException('Not authorized');
        }

        const user = await this.usersRepository.findOneWithRelations(id);

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // RBAC: Check owner access for non-super admins
        if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.id !== user.id) {
            if (user.ownerId !== currentUser.ownerId) {
                throw new NotFoundException(`User with ID ${id} not found`); // Hide existence
            }
        }

        const { hashedPassword, ...result } = user;
        return result;
    }

    async create(createUserDto: CreateUserDto) {
        const existingUser = await this.usersRepository.findOne({
            where: { email: createUserDto.email }
        });

        if (existingUser) {
            throw new BadRequestException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const newUser = this.usersRepository.create({
            ...createUserDto,
            id: crypto.randomUUID(),
            hashedPassword,
        });

        await this.usersRepository.save(newUser);

        const { hashedPassword: _, ...result } = newUser;
        return result;
    }

    async update(id: string, updateUserDto: any) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        if (updateUserDto.password) {
            updateUserDto.hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
            delete updateUserDto.password;
        }

        Object.assign(user, updateUserDto);
        await this.usersRepository.save(user);

        const { hashedPassword, ...result } = user;
        return result;
    }

    async remove(id: string) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        await this.usersRepository.remove(user);
        return { id };
    }
}
