import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CreateHerdBookDto } from './dto/create-herd-book.dto';
import { InitialImportHerdBookDto } from './dto/initial-import-herd-book.dto';
import { DryRunResultDto, RowErrorDto } from './dto/dry-run-result.dto';
import { ImportConfirmResultDto } from './dto/import-confirm-result.dto';
import { User, UserRole } from '../../platform/users/entities/user.entity';
import { HerdBooksRepository, HerdBooksFilters } from './herd-books.repository';
import { HerdBooksMapper } from './herd-books.mapper';
import { HerdBook } from './entities/herd-book.entity';
import { resolveOwnerIdFromUser } from '../../../common/utils/rbac.util';
import { CsvImportService } from '../csv-import/csv-import.service';
import { DataSource, QueryRunner } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Owner } from '../../platform/owners/entities/owner.entity';
import { Cattle } from '../cattle/entities/cattle.entity';
import { HerdBookCattle } from '../herd-book-cattle/entities/herd-book-cattle.entity';
import { Category } from '../../platform/categories/entities/category.entity';
import { Status } from '../../platform/status/entities/status.entity';
import { Character } from '../../platform/characters/entities/character.entity';
import { CategoriesRepository } from '../../platform/categories/categories.repository';
import { StatusRepository } from '../../platform/status/status.repository';
import { CharactersRepository } from '../../platform/characters/characters.repository';
import { Gender, SourceType } from '../cattle/entities/cattle.entity';

@Injectable()
export class HerdBooksService {
    constructor(
        private readonly herdBooksRepository: HerdBooksRepository,
        private readonly csvImportService: CsvImportService,
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly categoriesRepository: CategoriesRepository,
        private readonly statusRepository: StatusRepository,
        private readonly charactersRepository: CharactersRepository,
    ) { }

    async findAll(query: any, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, query.ownerId, 'herd books');

        const filters: HerdBooksFilters = {
            ...query,
            ownerId,
        };

        const result = await this.herdBooksRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: HerdBooksMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'herd book');
        const herdBook = await this.herdBooksRepository.findOneWithRelations(id, ownerId);
        if (!herdBook) {
            throw new NotFoundException(`HerdBook with ID ${id} not found`);
        }
        return HerdBooksMapper.toResponse(herdBook);
    }

    async create(createHerdBookDto: CreateHerdBookDto, user: User) {
        const herdBook = this.herdBooksRepository.create({
            ownerId: createHerdBookDto.ownerId ?? user.ownerId,
            ...createHerdBookDto,
        } as any) as unknown as HerdBook;

        await this.herdBooksRepository.save(herdBook);
        return this.findOne(herdBook.id, user);
    }

    async update(id: string, updateHerdBookDto: any, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'herd book');
        const herdBook = await this.herdBooksRepository.findOneWithRelations(id, ownerId);
        if (!herdBook) {
            throw new NotFoundException(`HerdBook with ID ${id} not found`);
        }

        Object.assign(herdBook, updateHerdBookDto);
        await this.herdBooksRepository.save(herdBook);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'herd book');
        const herdBook = await this.herdBooksRepository.findOneWithRelations(id, ownerId);
        if (!herdBook) {
            throw new NotFoundException(`HerdBook with ID ${id} not found`);
        }
        const response = HerdBooksMapper.toResponse(herdBook);
        await this.herdBooksRepository.remove(herdBook);
        return response;
    }

    async dryRunInitialImport(
        herdBookDto: InitialImportHerdBookDto,
        file: Express.Multer.File,
        user: User,
    ): Promise<DryRunResultDto> {
        // Security check: user must be OWNER_ADMIN
        if (user.role !== UserRole.OWNER_ADMIN) {
            throw new ForbiddenException('Only OWNER_ADMIN can perform initial import');
        }

        // Security check: user must be attached to an Owner
        if (!user.ownerId) {
            throw new ForbiddenException('User must be attached to an Owner');
        }

        // Load owner and check if initial import already completed
        const owner = await this.dataSource.getRepository(Owner).findOne({
            where: { id: user.ownerId },
        });

        if (!owner) {
            throw new NotFoundException('Owner not found');
        }

        if (owner.hasCompletedInitialImport) {
            throw new ForbiddenException('Initial import has already been completed for this owner');
        }

        // Validate file constraints
        this.csvImportService.validateFileConstraints(file);

        // Parse CSV
        const records = await this.csvImportService.parseAndSanitizeCsv(file.buffer, { delimiter: ';' });

        // Check max rows
        if (records.length > 100) {
            throw new BadRequestException('CSV file cannot contain more than 100 rows');
        }

        const errors: RowErrorDto[] = [];
        const nCarnetSet = new Set<number>();

        // Validate each row
        for (let i = 0; i < records.length; i++) {
            const rowNumber = i + 2; // +2 because header is row 1 and we start from 0
            const row = records[i];
            const rowErrors = await this.validateCsvRow(row, rowNumber, nCarnetSet);
            errors.push(...rowErrors);
        }

        const validRowsCount = records.length - errors.length;

        return {
            valid: errors.length === 0,
            totalRows: records.length,
            validRowsCount,
            errors,
        };
    }

    async confirmInitialImport(
        herdBookDto: InitialImportHerdBookDto,
        file: Express.Multer.File,
        user: User,
    ): Promise<ImportConfirmResultDto> {
        // Re-run ALL validations from dry-run (never trust client-side dry-run)
        const dryRunResult = await this.dryRunInitialImport(herdBookDto, file, user);

        // If any errors, reject import
        if (!dryRunResult.valid) {
            throw new BadRequestException(
                'CSV validation failed. Please fix the errors before importing.',
            );
        }

        // Start transaction
        const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Create HerdBook
            const herdBook = queryRunner.manager.create(HerdBook, {
                reference: herdBookDto.reference,
                description: herdBookDto.description,
                year: herdBookDto.year,
                ownerId: user.ownerId,
            });

            const savedHerdBook = await queryRunner.manager.save(herdBook);

            // Parse CSV again
            const records = await this.csvImportService.parseAndSanitizeCsv(file.buffer, { delimiter: ';' });

            // Create Cattle and HerdBookCattle for each row
            for (const row of records) {
                const cattle = queryRunner.manager.create(Cattle, {
                    ownerId: user.ownerId,
                    name: row.name,
                    nickname: row.nickname || null,
                    gender: row.gender as Gender,
                    birthDate: this.parseDate(row.birth_date),
                    characterId: row.character ? await this.resolveCharacterId(row.character) : null,
                    brand: row.brand || null,
                    distinctiveSign: row.distinctive_sign || null,
                    sourceType: row.source_type as SourceType,
                });

                const savedCattle = await queryRunner.manager.save(cattle);

                const categoryId = await this.resolveCategoryId(row.category);
                const statusId = await this.resolveStatusId(row.status);

                const herdBookCattle = queryRunner.manager.create(HerdBookCattle, {
                    herdBookId: savedHerdBook.id,
                    cattleId: savedCattle.id,
                    nCarnet: parseInt(row.n_carnet, 10),
                    categoryId,
                    statusId,
                });

                await queryRunner.manager.save(herdBookCattle);
            }

            // Update owner.hasCompletedInitialImport
            await queryRunner.manager.update(
                Owner,
                { id: user.ownerId },
                { hasCompletedInitialImport: true },
            );

            // Commit transaction
            await queryRunner.commitTransaction();

            return {
                herdBookId: savedHerdBook.id,
                cattleCount: records.length,
            };
        } catch (error) {
            // Rollback on any error
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async generateCsvTemplate(): Promise<Buffer> {
        const headers = [
            'n_carnet',
            'name',
            'nickname',
            'gender',
            'birth_date',
            'character',
            'brand',
            'distinctive_sign',
            'source_type',
            'category',
            'status',
        ];

        const example1 = [
            '1',
            'Vache1',
            '',
            'F',
            '15/01/2020',
            'Calme',
            '',
            'Marque rouge',
            'NE_DANS_TROUPEAU',
            'Laitière',
            'Actif',
        ];

        const example2 = [
            '2',
            'Taureau1',
            '',
            'M',
            '10/03/2019',
            '',
            'Bleu',
            '',
            'ACHETE',
            'Reproducteur',
            'Actif',
        ];

        // Add BOM for UTF-8
        const bom = '\uFEFF';
        const separator = ';';

        const csvContent =
            bom +
            headers.join(separator) +
            '\n' +
            example1.join(separator) +
            '\n' +
            example2.join(separator) +
            '\n';

        return Buffer.from(csvContent, 'utf8');
    }

    private async validateCsvRow(
        row: Record<string, string>,
        rowNumber: number,
        nCarnetSet: Set<number>,
    ): Promise<RowErrorDto[]> {
        const errors: RowErrorDto[] = [];

        // Validate n_carnet
        if (!row.n_carnet) {
            errors.push({ rowNumber, field: 'n_carnet', message: 'n_carnet is required' });
        } else {
            const nCarnet = parseInt(row.n_carnet, 10);
            if (isNaN(nCarnet)) {
                errors.push({ rowNumber, field: 'n_carnet', message: 'n_carnet must be a valid integer' });
            } else if (nCarnetSet.has(nCarnet)) {
                errors.push({ rowNumber, field: 'n_carnet', message: 'n_carnet must be unique within the file' });
            } else {
                nCarnetSet.add(nCarnet);
            }
        }

        // Validate name
        if (!row.name || row.name.trim() === '') {
            errors.push({ rowNumber, field: 'name', message: 'name is required' });
        }

        // Validate gender
        if (!row.gender || !['M', 'F'].includes(row.gender)) {
            errors.push({ rowNumber, field: 'gender', message: 'gender must be M or F' });
        }

        // Validate birth_date
        if (!row.birth_date) {
            errors.push({ rowNumber, field: 'birth_date', message: 'birth_date is required' });
        } else {
            const parsedDate = this.parseDate(row.birth_date);
            if (!parsedDate) {
                errors.push({ rowNumber, field: 'birth_date', message: 'birth_date must be in DD/MM/YYYY format' });
            }
        }

        // Validate source_type
        if (!row.source_type || !['NE_DANS_TROUPEAU', 'ACHETE'].includes(row.source_type)) {
            errors.push({ rowNumber, field: 'source_type', message: 'source_type must be NE_DANS_TROUPEAU or ACHETE' });
        }

        // Validate category
        if (!row.category || row.category.trim() === '') {
            errors.push({ rowNumber, field: 'category', message: 'category is required' });
        } else {
            const category = await this.categoriesRepository.findByName(row.category);
            if (!category) {
                errors.push({
                    rowNumber,
                    field: 'category',
                    message: `category '${row.category}' not found. Please check spelling.`,
                });
            }
        }

        // Validate status
        if (!row.status || row.status.trim() === '') {
            errors.push({ rowNumber, field: 'status', message: 'status is required' });
        } else {
            const status = await this.statusRepository.findByName(row.status);
            if (!status) {
                errors.push({
                    rowNumber,
                    field: 'status',
                    message: `status '${row.status}' not found. Please check spelling.`,
                });
            }
        }

        // Validate character (optional)
        if (row.character && row.character.trim() !== '') {
            const character = await this.charactersRepository.findByName(row.character);
            if (!character) {
                errors.push({
                    rowNumber,
                    field: 'character',
                    message: `character '${row.character}' not found. Please check spelling.`,
                });
            }
        }

        // Detect CSV injection risk on all free-text fields (not on constrained
        // enums/numbers, which are already validated above)
        const textFields: Array<keyof typeof row> = ['name', 'nickname', 'brand', 'distinctive_sign', 'character', 'category', 'status'];
        for (const field of textFields) {
            const value = row[field as string];
            if (value) {
                const { hasInjectionRisk } = this.csvImportService.checkCellInjectionRisk(value);
                if (hasInjectionRisk) {
                    errors.push({
                        rowNumber,
                        field: field as string,
                        message: `Value "${value}" starts with a potentially dangerous character (=, +, -, @). Please remove the prefix or escape it with an apostrophe.`,
                    });
                }
            }
        }

        return errors;
    }

    private parseDate(dateString: string): Date | null {
        // Expected format: DD/MM/YYYY
        const parts = dateString.split('/');
        if (parts.length !== 3) {
            return null;
        }

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);

        if (isNaN(day) || isNaN(month) || isNaN(year)) {
            return null;
        }

        const date = new Date(year, month - 1, day);
        if (isNaN(date.getTime())) {
            return null;
        }

        return date;
    }

    private async resolveCategoryId(categoryName: string): Promise<string> {
        const category = await this.categoriesRepository.findByName(categoryName);
        if (!category) {
            throw new BadRequestException(`Category '${categoryName}' not found`);
        }
        return category.id;
    }

    private async resolveStatusId(statusName: string): Promise<string> {
        const status = await this.statusRepository.findByName(statusName);
        if (!status) {
            throw new BadRequestException(`Status '${statusName}' not found`);
        }
        return status.id;
    }

    private async resolveCharacterId(characterName: string): Promise<string> {
        const character = await this.charactersRepository.findByName(characterName);
        if (!character) {
            throw new BadRequestException(`Character '${characterName}' not found`);
        }
        return character.id;
    }
}
