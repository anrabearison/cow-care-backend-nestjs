import { Injectable, NotFoundException } from '@nestjs/common';
import { PurchasesRepository } from './purchases.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
    constructor(private readonly purchasesRepository: PurchasesRepository) {}

    async findAllSuppliers(query: any, user?: any) {
        return this.purchasesRepository.findAllSuppliers({
            q: query.q,
            page: query.page ? Number(query.page) : 1,
            per_page: query.per_page ? Number(query.per_page) : 50,
            ownerId: user?.ownerId,
        });
    }

    async findOneSupplier(id: string, user?: any) {
        const supplier = await this.purchasesRepository.findOneSupplier(id, user?.ownerId);
        if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
        return supplier;
    }

    async createSupplier(dto: CreateSupplierDto, user?: any) {
        const supplier = this.purchasesRepository.createSupplier({
            ...dto,
            ownerId: user?.ownerId,
        });
        return this.purchasesRepository.saveSupplier(supplier);
    }

    async updateSupplier(id: string, dto: UpdateSupplierDto, user?: any) {
        const supplier = await this.findOneSupplier(id, user);
        Object.assign(supplier, dto);
        return this.purchasesRepository.saveSupplier(supplier);
    }

    async removeSupplier(id: string, user?: any) {
        const supplier = await this.findOneSupplier(id, user);
        await this.purchasesRepository.removeSupplier(supplier);
        return { message: 'Supplier deleted successfully' };
    }
}
