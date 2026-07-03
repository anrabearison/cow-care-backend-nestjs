import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersRepository, UsersFilters } from './users.repository';
import { UsersMapper } from './users.mapper';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
    constructor(
        private readonly usersRepository: UsersRepository,
    ) { }

    async findAll(query: any, currentUser: User) {
        if (currentUser.role === UserRole.OWNER_USER) {
            throw new ForbiddenException('Not authorized');
        }

        const filters: UsersFilters = {
            ...query,
        };

        if (currentUser.role !== UserRole.SUPER_ADMIN) {
            if (!currentUser.ownerId) {
                throw new ForbiddenException('User must belong to an owner');
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
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // RBAC Check
        if (currentUser.role !== UserRole.SUPER_ADMIN) {
            if (user.ownerId !== currentUser.ownerId && user.id !== currentUser.id) {
                throw new ForbiddenException('Not authorized');
            }
        }

        return UsersMapper.toResponse(user);
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
        } as any) as unknown as User;

        await this.usersRepository.save(newUser);
        return UsersMapper.toResponse(newUser);
    }

    async update(id: string, updateUserDto: any, currentUser: User) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // RBAC Check
        if (currentUser.role !== UserRole.SUPER_ADMIN && user.id !== currentUser.id && currentUser.ownerId !== user.ownerId) {
            throw new ForbiddenException('Not authorized');
        }

        if (updateUserDto.password) {
            updateUserDto.hashedPassword = await bcrypt.hash(updateUserDto.password, 10);
            delete updateUserDto.password;
        }

        Object.assign(user, updateUserDto);
        await this.usersRepository.save(user);
        return this.findOne(id, currentUser);
    }

    async remove(id: string, currentUser: User) {
        const user = await this.usersRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        // RBAC Check
        if (currentUser.role !== UserRole.SUPER_ADMIN && currentUser.ownerId !== user.ownerId) {
            throw new ForbiddenException('Not authorized');
        }

        const response = UsersMapper.toResponse(user);
        await this.usersRepository.remove(user);
        return response;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({ where: { email }, relations: ['owner'] });
    }
}
