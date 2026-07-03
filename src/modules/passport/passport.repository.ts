import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Passport } from './entities/passport.entity';

@Injectable()
export class PassportRepository {
    constructor(
        @InjectRepository(Passport)
        private readonly repository: Repository<Passport>,
    ) {}

    async create(passport: Partial<Passport>): Promise<Passport> {
        const newPassport = this.repository.create(passport);
        return await this.repository.save(newPassport);
    }

    async findAll(herdBookId?: string): Promise<Passport[]> {
        const queryBuilder = this.repository.createQueryBuilder('passport')
            .leftJoinAndSelect('passport.cattle', 'herdBookCattlePassport')
            .leftJoinAndSelect('herdBookCattlePassport.herdBookCattle', 'herdBookCattle')
            .leftJoinAndSelect('herdBookCattle.cattle', 'cattle')
            .leftJoinAndSelect('cattle.character', 'character')
            .leftJoinAndSelect('passport.herdBook', 'herdBook')
            .leftJoinAndSelect('passport.generator', 'generator')
            .orderBy('passport.createdAt', 'DESC');

        if (herdBookId) {
            queryBuilder.andWhere('passport.herdBookId = :herdBookId', { herdBookId });
        }

        return await queryBuilder.getMany();
    }

    async findOne(id: string): Promise<Passport> {
        return await this.repository.findOne({
            where: { id },
            relations: ['cattle', 'cattle.herdBookCattle', 'cattle.herdBookCattle.cattle', 'cattle.herdBookCattle.cattle.character', 'herdBook', 'generator'],
        });
    }

    async findByPassportNumber(passportNumber: string): Promise<Passport> {
        return await this.repository.findOne({
            where: { passportNumber },
            relations: ['cattle', 'cattle.herdBookCattle', 'cattle.herdBookCattle.cattle', 'cattle.herdBookCattle.cattle.character', 'herdBook', 'generator'],
        });
    }

    async update(id: string, passport: Partial<Passport>): Promise<Passport> {
        await this.repository.update(id, passport);
        return await this.findOne(id);
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async generatePassportNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await this.repository.count();
        const sequence = String(count + 1).padStart(4, '0');
        return `PASS-${year}-${sequence}`;
    }
}
