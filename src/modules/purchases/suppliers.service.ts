import { Injectable, NotFoundException } from '@nestjs/common';
import { PurchasesRepository } from './purchases.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { User } from '../users/entities/user.entity';
import { resolveOrganizationIdFromUser } from '../../common/utils/rbac.util';

@Injectable()
export class SuppliersService {
    constructor(private readonly purchasesRepository: PurchasesRepository) {}

    async findAllSuppliers(query: any, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, query.organizationId, 'suppliers');

        return this.purchasesRepository.findAllSuppliers({
            q: query.q,
            organizationId,
            page: query.page ? Number(query.page) : 1,
            per_page: query.per_page ? Number(query.per_page) : 50,
        });
    }

    async findOneSupplier(id: string, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'suppliers');
        const supplier = await this.purchasesRepository.findOneSupplier(id);
        
        if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);

        // Check organization access
        if (organizationId && supplier.organizationId && supplier.organizationId !== organizationId) {
            throw new NotFoundException(`Supplier ${id} not found`);
        }

        return supplier;
    }

    async createSupplier(dto: CreateSupplierDto, user: User) {
        const organizationId = resolveOrganizationIdFromUser(user, null, 'suppliers');
        
        const supplier = this.purchasesRepository.createSupplier({
            ...dto,
            organizationId,
        });
        return this.purchasesRepository.saveSupplier(supplier);
    }

    async updateSupplier(id: string, dto: UpdateSupplierDto, user: User) {
        const supplier = await this.findOneSupplier(id, user);
        Object.assign(supplier, dto);
        return this.purchasesRepository.saveSupplier(supplier);
    }

    async removeSupplier(id: string, user: User) {
        const supplier = await this.findOneSupplier(id, user);
        await this.purchasesRepository.removeSupplier(supplier);
        return { message: 'Supplier deleted successfully' };
    }
}
