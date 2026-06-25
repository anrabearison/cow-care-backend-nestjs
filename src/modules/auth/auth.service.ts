import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../entities/user.entity';
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
        const payload = { sub: user.email, id: user.id, role: user.role, ownerId: user.ownerId };
        // Transformer l'utilisateur pour inclure ownerId
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            ownerId: user.ownerId,
            owner: user.owner,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
        return {
            access_token: this.jwtService.sign(payload),
            token_type: 'bearer',
            user: userResponse,
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
            name: registerDto.name,
            email: registerDto.email,
            id: crypto.randomUUID(),
            hashedPassword,
            role: UserRole.OWNER_USER,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        await this.usersRepository.save(newUser);

        const { hashedPassword: _, ...result } = newUser;
        return result;
    }

    /**
     * Resolve the current user for JWT validation.
     * `sub` is the user id for new tokens; legacy tokens may still use email as `sub`.
     */
    async resolveUserFromJwtSubject(sub: string) {
        const where = sub.includes('@') ? { email: sub } : { id: sub };
        const user = await this.usersRepository.findOne({
            where,
            relations: ['owner'],
        });

        if (!user) {
            return null;
        }

        const { hashedPassword, ...result } = user;
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
