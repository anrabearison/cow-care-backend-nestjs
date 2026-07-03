import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { Supplier } from './entities/supplier.entity';
import { PurchaseItem } from './entities/purchase-item.entity';

@Injectable()
export class PurchasesRepository {
    constructor(
        @InjectRepository(Purchase)
        private readonly purchaseRepo: Repository<Purchase>,
        @InjectRepository(Supplier)
        private readonly supplierRepo: Repository<Supplier>,
        @InjectRepository(PurchaseItem)
        private readonly purchaseItemRepo: Repository<PurchaseItem>,
        private readonly dataSource: DataSource,
    ) {}

    create(data: Partial<Purchase>): Purchase {
        return this.purchaseRepo.create(data);
    }

    async save(purchase: Purchase): Promise<Purchase> {
        return this.purchaseRepo.save(purchase);
    }

    async findAllPurchases(filters: {
        ownerId?: string;
        supplierId?: string;
        page?: number;
        per_page?: number;
    }) {
        const { ownerId, supplierId, page = 1, per_page = 20 } = filters;
        const qb = this.purchaseRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.supplier', 'supplier')
            .leftJoinAndSelect('p.items', 'items')
            .leftJoinAndSelect('items.cattle', 'cattle');

        if (ownerId) qb.andWhere('p.owner_id = :ownerId', { ownerId });
        if (supplierId) qb.andWhere('p.supplier_id = :supplierId', { supplierId });

        qb.orderBy('p.purchase_date', 'DESC');
        qb.skip((page - 1) * per_page).take(per_page);

        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findOnePurchase(id: string, ownerId?: string): Promise<Purchase | null> {
        const qb = this.purchaseRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.supplier', 'supplier')
            .leftJoinAndSelect('p.items', 'items')
            .leftJoinAndSelect('items.cattle', 'cattle')
            .where('p.id = :id', { id });

        if (ownerId) qb.andWhere('p.owner_id = :ownerId', { ownerId });

        return qb.getOne();
    }

    async remove(purchase: Purchase): Promise<void> {
        await this.purchaseRepo.softRemove(purchase);
    }

    // Suppliers
    createSupplier(data: Partial<Supplier>): Supplier {
        return this.supplierRepo.create(data);
    }

    async saveSupplier(supplier: Supplier): Promise<Supplier> {
        return this.supplierRepo.save(supplier);
    }

    async findAllSuppliers(filters: { q?: string; page?: number; per_page?: number }) {
        const { q, page = 1, per_page = 20 } = filters;
        const qb = this.supplierRepo.createQueryBuilder('s');
        if (q) qb.where('s.name ILIKE :q', { q: `%${q}%` });
        qb.orderBy('s.name', 'ASC');
        qb.skip((page - 1) * per_page).take(per_page);
        const [data, total] = await qb.getManyAndCount();
        return { data, total };
    }

    async findOneSupplier(id: string): Promise<Supplier | null> {
        return this.supplierRepo.findOne({ where: { id } });
    }

    async removeSupplier(supplier: Supplier): Promise<void> {
        await this.supplierRepo.remove(supplier);
    }

    getPurchaseItemRepo(): Repository<PurchaseItem> {
        return this.purchaseItemRepo;
    }

    getDataSource(): DataSource {
        return this.dataSource;
    }
}
