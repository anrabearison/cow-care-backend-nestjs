import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { CsvImportService } from './csv-import.service';

describe('CsvImportService', () => {
  let service: CsvImportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CsvImportService],
    }).compile();

    service = module.get<CsvImportService>(CsvImportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseCsvBuffer', () => {
    it('should parse a valid CSV buffer', async () => {
      const csvBuffer = Buffer.from(
        'n_carnet,name,gender\n1,Vache1,F\n2,Taureau1,M',
        'utf8',
      );

      const result = await service.parseCsvBuffer(csvBuffer);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ n_carnet: '1', name: 'Vache1', gender: 'F' });
      expect(result[1]).toEqual({ n_carnet: '2', name: 'Taureau1', gender: 'M' });
    });

    it('should parse CSV with semicolon separator', async () => {
      const csvBuffer = Buffer.from(
        'n_carnet;name;gender\n1;Vache1;F\n2;Taureau1;M',
        'utf8',
      );

      const result = await service.parseCsvBuffer(csvBuffer, { delimiter: ';' });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ n_carnet: '1', name: 'Vache1', gender: 'F' });
    });

    it('should handle empty CSV', async () => {
      const csvBuffer = Buffer.from('n_carnet,name,gender\n', 'utf8');

      const result = await service.parseCsvBuffer(csvBuffer);

      expect(result).toHaveLength(0);
    });

    it('should throw BadRequestException on malformed CSV', async () => {
      // CSV with unclosed quote will cause parsing error
      const malformedBuffer = Buffer.from('n_carnet,name,gender\n1,"Vache1,F\n2,Taureau1,M', 'utf8');

      await expect(service.parseCsvBuffer(malformedBuffer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('validateFileConstraints', () => {
    it('should validate a valid CSV file', () => {
      const file = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: 1024,
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      expect(() => service.validateFileConstraints(file)).not.toThrow();
    });

    it('should throw BadRequestException when no file provided', () => {
      expect(() => service.validateFileConstraints(null)).toThrow(BadRequestException);
      expect(() => service.validateFileConstraints(undefined)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid MIME type', () => {
      const file = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      expect(() => service.validateFileConstraints(file)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for file too large', () => {
      const file = {
        fieldname: 'file',
        originalname: 'test.csv',
        encoding: '7bit',
        mimetype: 'text/csv',
        size: 6 * 1024 * 1024, // 6 Mo
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      expect(() => service.validateFileConstraints(file)).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid extension', () => {
      const file = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from(''),
      } as Express.Multer.File;

      expect(() => service.validateFileConstraints(file)).toThrow(BadRequestException);
    });
  });

  describe('sanitizeCellValue', () => {
    it('should return normal values unchanged', () => {
      expect(service.sanitizeCellValue('normal value')).toBe('normal value');
      expect(service.sanitizeCellValue('123')).toBe('123');
      expect(service.sanitizeCellValue('')).toBe('');
    });

    it('should trim whitespace', () => {
      expect(service.sanitizeCellValue('  value  ')).toBe('value');
    });

    it('should throw BadRequestException for values starting with =', () => {
      expect(() => service.sanitizeCellValue('=1+1')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for values starting with +', () => {
      expect(() => service.sanitizeCellValue('+123')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for values starting with -', () => {
      expect(() => service.sanitizeCellValue('-123')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for values starting with @', () => {
      expect(() => service.sanitizeCellValue('@formula')).toThrow(BadRequestException);
    });

    it('should throw BadRequestException for values with dangerous prefix after trim', () => {
      expect(() => service.sanitizeCellValue('  =1+1  ')).toThrow(BadRequestException);
    });
  });

  describe('sanitizeRecord', () => {
    it('should sanitize all values in a record', () => {
      const record = {
        n_carnet: '1',
        name: 'Vache1',
        gender: 'F',
        brand: '=dangerous',
      };

      expect(() => service.sanitizeRecord(record)).toThrow(BadRequestException);
    });

    it('should return sanitized record when all values are safe', () => {
      const record = {
        n_carnet: '1',
        name: 'Vache1',
        gender: 'F',
      };

      const result = service.sanitizeRecord(record);

      expect(result).toEqual({
        n_carnet: '1',
        name: 'Vache1',
        gender: 'F',
      });
    });
  });

  describe('parseAndSanitizeCsv', () => {
    it('should parse and sanitize a valid CSV', async () => {
      const csvBuffer = Buffer.from(
        'n_carnet,name,gender\n1,Vache1,F\n2,Taureau1,M',
        'utf8',
      );

      const result = await service.parseAndSanitizeCsv(csvBuffer);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ n_carnet: '1', name: 'Vache1', gender: 'F' });
    });

    it('should throw BadRequestException if CSV contains dangerous values', async () => {
      const csvBuffer = Buffer.from(
        'n_carnet,name,gender\n1,=dangerous,F',
        'utf8',
      );

      await expect(service.parseAndSanitizeCsv(csvBuffer)).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
