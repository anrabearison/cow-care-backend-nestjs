import { Cattle } from './cattle.entity';
import { HerdBook } from './herd-book.entity';
export declare class HerdBookCattle {
    id: string;
    herdBookId: string;
    herdBook: HerdBook;
    cattleId: string;
    cattle: Cattle;
    nCarnet: string;
    categoryId: string;
    category: any;
    statusId: string;
    status: any;
    createdAt: Date;
    updatedAt: Date;
}
