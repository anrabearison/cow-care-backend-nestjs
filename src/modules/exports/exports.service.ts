import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import PdfPrinter from 'pdfmake';
import { Response } from 'express';

@Injectable()
export class ExportsService {
    async exportToExcel(data: any[], columns: any[], res: Response) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Data');

        worksheet.columns = columns;
        worksheet.addRows(data);

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=export.xlsx',
        );

        await workbook.xlsx.write(res);
        res.end();
    }

    async exportToPdf(data: any[], res: Response) {
        // Basic PDF generation logic - can be expanded based on specific requirements
        const fonts = {
            Roboto: {
                normal: 'fonts/Roboto-Regular.ttf',
                bold: 'fonts/Roboto-Medium.ttf',
                italics: 'fonts/Roboto-Italic.ttf',
                bolditalics: 'fonts/Roboto-MediumItalic.ttf'
            }
        };

        // Note: In a real implementation, we'd need to handle fonts properly
        // For now, we'll assume a simplified structure or mock

        // Placeholder for PDF generation logic
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=export.pdf');
        res.send('PDF Export not fully implemented yet - requires font setup');
    }
}
