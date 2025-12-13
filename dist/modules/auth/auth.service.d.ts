import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private usersRepository;
    private jwtService;
    constructor(usersRepository: Repository<User>, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
        token_type: string;
        user: any;
    }>;
    register(registerDto: RegisterDto): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("../../entities/user.entity").UserRole;
        isActive: boolean;
        ownerId: string;
        owner: import("../../entities/owner.entity").Owner;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getProfile(email: string): Promise<{
        id: string;
        name: string;
        email: string;
        role: import("../../entities/user.entity").UserRole;
        isActive: boolean;
        ownerId: string;
        owner: import("../../entities/owner.entity").Owner;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
