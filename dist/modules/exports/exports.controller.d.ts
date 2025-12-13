import { Response } from 'express';
import { ExportsService } from './exports.service';
export declare class ExportsController {
    private readonly exportsService;
    constructor(exportsService: ExportsService);
    exportExcel(type: string, res: Response): Promise<void>;
    exportPdf(type: string, res: Response): Promise<void>;
}
