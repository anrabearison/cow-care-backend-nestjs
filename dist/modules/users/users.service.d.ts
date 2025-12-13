import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findAll(query: any): Promise<{
        data: {
            id: string;
            name: string;
            email: string;
            role: import("../../entities/user.entity").UserRole;
            isActive: boolean;
            ownerId: string;
            owner: import("../../entities/owner.entity").Owner;
            createdAt: Date;
            updatedAt: Date;
        }[];
        total: number;
        page: number;
        per_page: number;
    }>;
    findOne(id: string): Promise<{
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
    create(createUserDto: CreateUserDto): Promise<{
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
    update(id: string, updateUserDto: any): Promise<{
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
    remove(id: string): Promise<{
        id: string;
    }>;
}
