import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { OwnersRepository, OwnersFilters } from './owners.repository';
import { OwnersMapper } from './owners.mapper';
import { Owner } from './entities/owner.entity';
import { User, UserRole } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class OwnersService {
    constructor(
        private readonly ownersRepository: OwnersRepository,
        @InjectDataSource() private readonly dataSource: DataSource,
    ) { }

    async findAll(query: any, user?: User) {
        const filters: OwnersFilters = { ...query };
        
        // OWNER_ADMIN and OWNER_USER can only see their own owner
        if (user && user.role !== UserRole.SUPER_ADMIN && user.ownerId) {
            filters.id = user.ownerId;
        }
        
        const result = await this.ownersRepository.findAllWithRelations(filters, query);

        return {
            ...result,
            data: OwnersMapper.toResponseList(result.data)
        };
    }

    async findOne(id: string, user?: User) {
        // OWNER_ADMIN and OWNER_USER can only access their own owner
        if (user && user.role !== UserRole.SUPER_ADMIN && user.ownerId !== id) {
            throw new ForbiddenException('You can only access your own owner');
        }
        
        const owner = await this.ownersRepository.findOne({ where: { id } });
        if (!owner) {
            throw new NotFoundException(`Owner with ID ${id} not found`);
        }
        return OwnersMapper.toResponse(owner);
    }

    async create(createOwnerDto: CreateOwnerDto) {
        const owner = this.ownersRepository.create({
            id: crypto.randomUUID(),
            ...createOwnerDto,
        } as any) as unknown as Owner;

        await this.ownersRepository.save(owner);
        return this.findOne(owner.id);
    }

    async update(id: string, updateOwnerDto: any, user?: User) {
        // OWNER_ADMIN can only update their own owner
        if (user && user.role === UserRole.OWNER_ADMIN && user.ownerId !== id) {
            throw new ForbiddenException('You can only update your own owner');
        }
        
        const owner = await this.ownersRepository.findOne({ where: { id } });
        if (!owner) {
            throw new NotFoundException(`Owner with ID ${id} not found`);
        }

        Object.assign(owner, updateOwnerDto);
        await this.ownersRepository.save(owner);
        return this.findOne(id, user);
    }

    async remove(id: string) {
        const owner = await this.ownersRepository.findOne({ where: { id } });
        if (!owner) {
            throw new NotFoundException(`Owner with ID ${id} not found`);
        }

        // Vérification préventive des dépendances avant suppression
        const [cattleCount, herdBookCount, purchaseCount] = await Promise.all([
            this.dataSource.query(
                'SELECT COUNT(*) FROM cattle WHERE owner_id = $1', [id]
            ),
            this.dataSource.query(
                'SELECT COUNT(*) FROM herd_books WHERE owner_id = $1', [id]
            ),
            this.dataSource.query(
                'SELECT COUNT(*) FROM purchases WHERE owner_id = $1', [id]
            ),
        ]);

        const dependencies: string[] = [];
        if (parseInt(cattleCount[0].count) > 0) dependencies.push(`${cattleCount[0].count} bovin(s)`);
        if (parseInt(herdBookCount[0].count) > 0) dependencies.push(`${herdBookCount[0].count} livre(s) généalogique(s)`);
        if (parseInt(purchaseCount[0].count) > 0) dependencies.push(`${purchaseCount[0].count} achat(s)`);

        if (dependencies.length > 0) {
            throw new BadRequestException(
                `Impossible de supprimer ce propriétaire : il est encore associé à ${dependencies.join(', ')}. Supprimez ces éléments d'abord.`
            );
        }

        const response = OwnersMapper.toResponse(owner);
        await this.ownersRepository.remove(owner);
        return response;
    }
}
