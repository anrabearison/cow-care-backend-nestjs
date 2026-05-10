import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Character } from '../../entities/character.entity';

@Injectable()
export class CharactersRepository extends Repository<Character> {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
    ) {
        super(Character, dataSource.createEntityManager());
    }

    async findAllWithRelations(): Promise<Character[]> {
        return this.find();
    }

    async findOneWithRelations(id: string): Promise<Character | null> {
        return this.findOne({ where: { id } });
    }
}
