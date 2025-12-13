import { UserRole } from '../../../entities/user.entity';
export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
}
