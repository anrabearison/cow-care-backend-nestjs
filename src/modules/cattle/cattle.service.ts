import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Cattle, Gender, SourceType } from '../../entities/cattle.entity';
import { CreateCattleDto } from './dto/create-cattle.dto';
import { User, UserRole } from '../../entities/user.entity';
import { HerdBook } from '../../entities/herd-book.entity';
import { HerdBookCattle } from '../../entities/herd-book-cattle.entity';
import { Character } from '../../entities/character.entity';

@Injectable()
export class CattleService {
    constructor(
        @InjectRepository(Cattle)
        private cattleRepository: Repository<Cattle>,
        @InjectRepository(HerdBook)
        private herdBookRepository: Repository<HerdBook>,
        @InjectRepository(HerdBookCattle)
        private herdBookCattleRepository: Repository<HerdBookCattle>,
        @InjectRepository(Character)
        private characterRepository: Repository<Character>,
    ) { }

    async findAll(query: any, user: User) {
        const {
            page = 1,
            per_page = 10,
            sort = 'id',
            order = 'ASC',
            q,
            gender,
            category,
            character,
            source_type,
            owner_id,
            herd_book_id
        } = query;

        const skip = (page - 1) * per_page;

        const qb = this.cattleRepository.createQueryBuilder('cattle')
            .leftJoinAndSelect('cattle.character', 'character')
            .leftJoinAndSelect('cattle.herdBookEntries', 'herdBookEntries')
            .leftJoinAndSelect('herdBookEntries.herdBook', 'herdBook')
            .leftJoinAndSelect('herdBookEntries.category', 'category')
            .leftJoinAndSelect('herdBookEntries.status', 'status')
            .leftJoinAndSelect('cattle.events', 'events')
            .leftJoinAndSelect('cattle.treatments', 'treatments');

        // Filter by owner if not super admin
        if (user.role !== UserRole.SUPER_ADMIN) {
            if (user.ownerId) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: user.ownerId });
            } else {
                // Return empty if no owner assigned
                return { data: [], total: 0, page: Number(page), per_page: Number(per_page) };
            }
        } else {
            // Super admin can filter by owner_id
            if (owner_id) {
                qb.andWhere('herdBook.ownerId = :ownerId', { ownerId: owner_id });
            }
        }

        if (herd_book_id) {
            qb.andWhere('herdBook.id = :herdBookId', { herdBookId: herd_book_id });
        }

        if (q) {
            qb.andWhere('(cattle.name ILIKE :q OR cattle.nickname ILIKE :q OR cattle.id ILIKE :q)', { q: `%${q}%` });
        }

        if (gender) {
            qb.andWhere('cattle.gender = :gender', { gender });
        }

        if (character) {
            qb.andWhere('cattle.characterId = :character', { character });
        }

        if (source_type) {
            qb.andWhere('cattle.sourceType = :sourceType', { sourceType: source_type });
        }

        if (category) {
            qb.andWhere('herdBookEntries.categoryId = :category', { category });
        }

        // Apply distinct to avoid duplicates from joins
        qb.distinct(true);

        qb.orderBy(`cattle.${sort}`, order as 'ASC' | 'DESC');
        qb.skip(skip).take(per_page);

        const [rawData, total] = await qb.getManyAndCount();

        const data = rawData.map(cattle => this.toResponse(cattle, herd_book_id));

        return {
            data,
            total,
            page: Number(page),
            per_page: Number(per_page)
        };
    }

    async findOne(id: string, user: User) {
        const qb = this.cattleRepository.createQueryBuilder('cattle')
            .leftJoinAndSelect('cattle.character', 'character')
            .leftJoinAndSelect('cattle.mother', 'mother')
            .leftJoinAndSelect('cattle.herdBookEntries', 'herdBookEntries')
            .leftJoinAndSelect('herdBookEntries.herdBook', 'herdBook')
            .leftJoinAndSelect('herdBookEntries.category', 'category')
            .leftJoinAndSelect('herdBookEntries.status', 'status')
            .leftJoinAndSelect('cattle.events', 'events')
            .leftJoinAndSelect('cattle.treatments', 'treatments')
            .where('cattle.id = :id', { id });

        const cattle = await qb.getOne();

        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        return this.toResponse(cattle);
    }

    private toResponse(cattle: Cattle, herdBookId?: string) {
        // Find relevant herd book entry
        let entry = null;
        if (cattle.herdBookEntries && cattle.herdBookEntries.length > 0) {
            if (herdBookId) {
                entry = cattle.herdBookEntries.find(e => e.herdBookId === herdBookId);
            }
            if (!entry) {
                entry = cattle.herdBookEntries[0];
            }
        }

        return {
            id: cattle.id,
            name: cattle.name,
            nickname: cattle.nickname,
            gender: cattle.gender,
            birthDate: cattle.birthDate,
            character: cattle.character ? {
                id: cattle.character.id,
                name: cattle.character.name
            } : null,
            brand: cattle.brand,
            distinctiveSign: cattle.distinctiveSign,
            photo: cattle.photo,
            created_at: cattle.createdAt,
            updated_at: cattle.updatedAt,

            // Flattened HerdBookCattle fields
            category: entry?.category ? {
                id: entry.category.id,
                name: entry.category.name
            } : null,
            status: entry?.status ? {
                id: entry.status.id,
                name: entry.status.name
            } : null,
            n_carnet: entry?.nCarnet || null,
            owner_id: entry?.herdBook?.ownerId || null,

            // Structured source object
            source: {
                type: cattle.sourceType,
                supplier: cattle.sourceSupplier,
                purchaseDate: cattle.sourcePurchaseDate,
                purchasePrice: cattle.sourcePurchasePrice ? Number(cattle.sourcePurchasePrice) : null,
                purchaseWeight: cattle.sourcePurchaseWeight ? Number(cattle.sourcePurchaseWeight) : null,
                purchaseHealthStatus: cattle.sourcePurchaseHealthStatus,
                purchaseNotes: cattle.sourcePurchaseNotes,
                motherId: cattle.sourceMotherId,
            },

            // Relations
            events: cattle.events || [],
            treatments: cattle.treatments || [],
            herdBookEntries: cattle.herdBookEntries || []
        };
    }

    async create(createCattleDto: CreateCattleDto, user: User) {
        try {
            const { character, events, treatments, source, ...cattleData } = createCattleDto;

            // Transform source.type from French to enum
            let sourceType = source.type;
            if (sourceType === 'Acheté' || sourceType === 'ACHETE') {
                sourceType = SourceType.ACHETE;
            } else if (sourceType === 'Né dans le troupeau' || sourceType === 'NE_DANS_TROUPEAU') {
                sourceType = SourceType.NE_DANS_TROUPEAU;
            }

            const cattle = this.cattleRepository.create({
                ...cattleData,
                id: crypto.randomUUID(),
                characterId: character,
                sourceType: sourceType as SourceType,
                sourceSupplier: source.supplier,
                sourcePurchaseDate: source.purchaseDate,
                sourcePurchasePrice: source.purchasePrice,
                sourcePurchaseWeight: source.purchaseWeight,
                sourcePurchaseHealthStatus: source.purchaseHealthStatus,
                sourcePurchaseNotes: source.purchaseNotes,
                sourceMotherId: source.motherId,
            });

            await this.cattleRepository.save(cattle);

            // Register in herd book if requested
            if (createCattleDto.herd_book_id) {
                const entry = this.herdBookCattleRepository.create({
                    id: crypto.randomUUID(),
                    cattleId: cattle.id,
                    herdBookId: createCattleDto.herd_book_id,
                    categoryId: createCattleDto.category || 'default_category_id',
                    statusId: 'STAT004',
                });
                await this.herdBookCattleRepository.save(entry);
            }

            return this.findOne(cattle.id, user);
        } catch (error) {
            console.error('Error creating cattle:', error);
            throw error;
        }
    }

    async update(id: string, updateCattleDto: any, user: User) {
        const cattle = await this.findOne(id, user);

        // Update logic here
        Object.assign(cattle, updateCattleDto);

        await this.cattleRepository.save(cattle);
        return this.findOne(id, user);
    }

    async remove(id: string, user: User) {
        const cattle = await this.cattleRepository.findOne({
            where: { id },
            relations: ['character', 'herdBookEntries', 'herdBookEntries.herdBook', 'herdBookEntries.category', 'herdBookEntries.status']
        });

        if (!cattle) {
            throw new NotFoundException(`Cattle with ID ${id} not found`);
        }

        const response = this.toResponse(cattle);
        await this.cattleRepository.remove(cattle);
        return response;
    }

    async getStatistics(ownerId: string, user: User) {
        const totalCattle = await this.cattleRepository.count();
        const males = await this.cattleRepository.count({ where: { gender: Gender.M } });
        const females = await this.cattleRepository.count({ where: { gender: Gender.F } });

        return {
            total: totalCattle,
            males,
            females,
            calves: 0, // Logic to calculate calves based on age
            heifers: 0, // Logic for heifers
            cows: 0, // Logic for cows
            bulls: 0 // Logic for bulls
        };
    }
}
