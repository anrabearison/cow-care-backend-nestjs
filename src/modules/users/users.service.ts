import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findAll(query: any, currentUser: User) {
        // RBAC: Owner Users cannot list users
        if (currentUser.role === UserRole.OWNER_USER) {
            throw new BadRequestException('Not authorized'); // Using BadRequest to match 403/400 behavior or ForbiddenException if available
        }

        const { page = 1, per_page = 10, sort = 'name', order = 'ASC', q, role, id, owner_id } = query;
        const skip = (page - 1) * per_page;

        const qb = this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.owner', 'owner');

        // RBAC: Filter by owner for non-super admins
        if (currentUser.role !== UserRole.SUPER_ADMIN) {
            if (!currentUser.ownerId) {
                return { data: [], total: 0, page: Number(page), per_page: Number(per_page) };
            }
            qb.andWhere('user.ownerId = :currentOwnerId', { currentOwnerId: currentUser.ownerId });
        } else if (owner_id) {
            // Super admin filtering by owner
            qb.andWhere('user.ownerId = :ownerId', { ownerId: owner_id });
        }

        // Filtering
        if (q) {
            qb.andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', { q: `%${q}%` });
        }
        if (role) {
            qb.andWhere('user.role = :role', { role });
        }
        if (id) {
            const ids = Array.isArray(id) ? id : [id];
            qb.andWhere('user.id IN (:...ids)', { ids });
        }

        // Sorting
        // Map snake_case sort fields to camelCase entity properties if needed
        const sortMapping = {
            'owner_id': 'ownerId',
            'created_at': 'createdAt',
            'updated_at': 'updatedAt'
        };
        const sortField = sortMapping[sort] || sort;

        qb.orderBy(`user.${sortField}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [data, total] = await qb.getManyAndCount();

        // Remove password from response
        const safeData = data.map(user => {
            const { hashedPassword, ...result } = user;
            return result;
        });

        return {
            data: safeData,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string, currentUser: User) {
        // RBAC: Owner Users can only see themselves
        if (currentUser.role === UserRole.OWNER_USER && currentUser.id !== id) {
            throw new BadRequestException('Not authorized');
        }

        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['owner']
        });

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
