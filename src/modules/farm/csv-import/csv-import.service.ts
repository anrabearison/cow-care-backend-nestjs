import { Injectable, BadRequestException } from '@nestjs/common';
import { parse } from 'csv-parse';

export interface CsvParseOptions {
  delimiter?: string;
  encoding?: string;
  fromLine?: number;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

@Injectable()
export class CsvImportService {
  private readonly ALLOWED_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo
  private readonly CSV_EXTENSION = '.csv';

  /**
   * Parse un buffer CSV et retourne un tableau d'objets avec les en-têtes comme clés
   */
  async parseCsvBuffer(
    buffer: Buffer,
    options: CsvParseOptions = {},
  ): Promise<Record<string, string>[]> {
    const defaultOptions: CsvParseOptions = {
      delimiter: ',',
      encoding: 'utf8',
      ...options,
    };

    return new Promise((resolve, reject) => {
      const records: Record<string, string>[] = [];

      parse(buffer, {
        delimiter: defaultOptions.delimiter,
        encoding: defaultOptions.encoding,
        trim: true,
        skipEmptyLines: true,
        columns: true, // Use first row as headers
        relax_column_count: true, // Allow inconsistent column counts
      } as any)
        .on('data', (record) => {
          records.push(record);
        })
        .on('error', (error) => {
          reject(new BadRequestException(`CSV parsing error: ${error.message}`));
        })
        .on('end', () => {
          resolve(records);
        });
    });
  }

  /**
   * Valide les contraintes du fichier (type MIME, taille, extension)
   */
  validateFileConstraints(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate MIME type
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size is ${this.MAX_FILE_SIZE / 1024 / 1024} Mo`,
      );
    }

    // Validate file extension
    if (!file.originalname.toLowerCase().endsWith(this.CSV_EXTENSION)) {
      throw new BadRequestException(
        `Invalid file extension. Only ${this.CSV_EXTENSION} files are allowed`,
      );
    }
  }

  /**
   * Sanitize une valeur de cellule CSV pour prévenir les injections
   * Rejette explicitement les valeurs commençant par =, +, -, @
   */
  sanitizeCellValue(value: string): string {
    if (!value) {
      return value;
    }

    const trimmedValue = value.trim();
    const dangerousPrefixes = ['=', '+', '-', '@'];

    if (dangerousPrefixes.some(prefix => trimmedValue.startsWith(prefix))) {
      throw new BadRequestException(
        `CSV injection detected: value "${trimmedValue}" starts with a dangerous prefix (${dangerousPrefixes.join(', ')}). Please remove the prefix or use an apostrophe to escape it.`,
      );
    }

    return trimmedValue;
  }

  /**
   * Sanitize toutes les valeurs d'un enregistrement CSV
   */
  sanitizeRecord(record: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};

    for (const [key, value] of Object.entries(record)) {
      sanitized[key] = this.sanitizeCellValue(value);
    }

    return sanitized;
  }

  /**
   * Parse et sanitize un fichier CSV complet
   */
  async parseAndSanitizeCsv(
    buffer: Buffer,
    options?: CsvParseOptions,
  ): Promise<Record<string, string>[]> {
    const records = await this.parseCsvBuffer(buffer, options);
    return records.map(record => this.sanitizeRecord(record));
  }
}
