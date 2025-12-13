import { Response } from 'express';
export declare class ExportsService {
    exportToExcel(data: any[], columns: any[], res: Response): Promise<void>;
    exportToPdf(data: any[], res: Response): Promise<void>;
}
