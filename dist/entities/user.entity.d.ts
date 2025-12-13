import { Owner } from './owner.entity';
export declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    OWNER_ADMIN = "OWNER_ADMIN",
    OWNER_USER = "OWNER_USER"
}
export declare class User {
    id: string;
    name: string;
    email: string;
    hashedPassword: string;
    role: UserRole;
    isActive: boolean;
    ownerId: string;
    owner: Owner;
    createdAt: Date;
    updatedAt: Date;
}
