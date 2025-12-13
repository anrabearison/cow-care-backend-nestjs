import { Response } from 'express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    findAll(query: any, res: Response): Promise<void>;
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
