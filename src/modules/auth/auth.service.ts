import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
        private jwtService: JwtService,
    ) { }

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.usersRepository.findOne({
            where: { email },
            relations: ['owner']
        });

        if (user && await bcrypt.compare(pass, user.hashedPassword)) {
            const { hashedPassword, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { sub: user.email, id: user.id, role: user.role };
        return {
            access_token: this.jwtService.sign(payload),
            token_type: 'bearer',
            user: user,
        };
    }

    async register(registerDto: RegisterDto) {
        const existingUser = await this.usersRepository.findOne({
            where: { email: registerDto.email }
        });

        if (existingUser) {
            throw new BadRequestException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const newUser = this.usersRepository.create({
            ...registerDto,
            id: crypto.randomUUID(),
            hashedPassword,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.usersRepository.save(newUser);

        const { hashedPassword: _, ...result } = newUser;
        return result;
    }

    async getProfile(email: string) {
        const user = await this.usersRepository.findOne({
            where: { email },
            relations: ['owner']
        });

        if (!user) {
            throw new UnauthorizedException();
        }

        const { hashedPassword, ...result } = user;
        return result;
    }
}
