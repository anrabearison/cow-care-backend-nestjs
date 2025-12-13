import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
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
    getProfile(req: any): any;
    token(form: any): Promise<{
        access_token: string;
        token_type: string;
        user: any;
    }>;
}
