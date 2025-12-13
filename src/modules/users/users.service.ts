import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    async findAll(query: any) {
        const { page = 1, per_page = 10, sort = 'name', order = 'ASC', q } = query;
        const skip = (page - 1) * per_page;

        const qb = this.usersRepository.createQueryBuilder('user')
            .leftJoinAndSelect('user.owner', 'owner');

        if (q) {
            qb.andWhere('(user.name ILIKE :q OR user.email ILIKE :q)', { q: `%${q}%` });
        }

        qb.orderBy(`user.${sort}`, order as 'ASC' | 'DESC');
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

    async findOne(id: string) {
        const user = await this.usersRepository.findOne({
            where: { id },
            relations: ['owner']
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
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
