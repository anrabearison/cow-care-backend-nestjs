import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../platform/users/entities/user.entity';
import { PurchasesRepository } from './purchases.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { resolveOwnerIdFromUser } from '../../../common/utils/rbac.util';

@Injectable()
export class SuppliersService {
    constructor(private readonly purchasesRepository: PurchasesRepository) {}

    async findAllSuppliers(query: any, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, query.ownerId, 'suppliers');

        return this.purchasesRepository.findAllSuppliers({
            q: query.q,
            page: query.page ? Number(query.page) : 1,
            per_page: query.per_page ? Number(query.per_page) : 50,
            ownerId,
        });
    }

    async findOneSupplier(id: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'supplier');
        const supplier = await this.purchasesRepository.findOneSupplier(id, ownerId);
        if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
        return supplier;
    }

    async createSupplier(dto: CreateSupplierDto, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, dto.ownerId, 'suppliers');

        const supplier = this.purchasesRepository.createSupplier({
            ...dto,
            ownerId,
        });
        return this.purchasesRepository.saveSupplier(supplier);
    }

    async updateSupplier(id: string, dto: UpdateSupplierDto, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'supplier');
        const supplier = await this.purchasesRepository.findOneSupplier(id, ownerId);
        if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
        Object.assign(supplier, dto);
        return this.purchasesRepository.saveSupplier(supplier);
    }

    async removeSupplier(id: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'supplier');
        const supplier = await this.purchasesRepository.findOneSupplier(id, ownerId);
        if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
        await this.purchasesRepository.removeSupplier(supplier);
        return { message: 'Supplier deleted successfully' };
    }
}
