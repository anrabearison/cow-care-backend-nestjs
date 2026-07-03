import { Injectable, NotFoundException } from '@nestjs/common';
import { PurchasesRepository } from './purchases.repository';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
    constructor(private readonly purchasesRepository: PurchasesRepository) {}

    async findAllSuppliers(query: any) {
        return this.purchasesRepository.findAllSuppliers({
            q: query.q,
            page: query.page ? Number(query.page) : 1,
            per_page: query.per_page ? Number(query.per_page) : 50,
        });
    }

    async findOneSupplier(id: string) {
        const supplier = await this.purchasesRepository.findOneSupplier(id);
        if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
        return supplier;
    }

    async createSupplier(dto: CreateSupplierDto) {
        const supplier = this.purchasesRepository.createSupplier(dto);
        return this.purchasesRepository.saveSupplier(supplier);
    }

    async updateSupplier(id: string, dto: UpdateSupplierDto) {
        const supplier = await this.findOneSupplier(id);
        Object.assign(supplier, dto);
        return this.purchasesRepository.saveSupplier(supplier);
    }

    async removeSupplier(id: string) {
        const supplier = await this.findOneSupplier(id);
        await this.purchasesRepository.removeSupplier(supplier);
        return { message: 'Supplier deleted successfully' };
    }
}
