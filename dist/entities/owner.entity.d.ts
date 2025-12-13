import { User } from './user.entity';
export declare class Owner {
    id: string;
    name: string;
    contactInfo: string;
    address: string;
    users: User[];
    createdAt: Date;
    updatedAt: Date;
}
