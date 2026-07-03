import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { User, UserRole } from '../users/entities/user.entity';
import { PurchasesRepository } from './purchases.repository';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { PurchaseItem } from './entities/purchase-item.entity';

@Injectable()
export class PurchasesService {
    constructor(private readonly purchasesRepository: PurchasesRepository) {}

    // ─── Purchases ──────────────────────────────────────────────────────────────

    async findAllPurchases(query: any, user: User) {
        let ownerId: string | null = null;
        if (user.role === UserRole.SUPER_ADMIN) {
            ownerId = query.ownerId ?? null;
        } else {
            if (!user.ownerId) throw new ForbiddenException('User must belong to an owner');
            ownerId = user.ownerId;
        }

        return this.purchasesRepository.findAllPurchases({
            ownerId,
            supplierId: query.supplierId,
            page: query.page ? Number(query.page) : 1,
            per_page: query.per_page ? Number(query.per_page) : 20,
        });
    }

    async findOnePurchase(id: string, user: User) {
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : undefined;
        const purchase = await this.purchasesRepository.findOnePurchase(id, ownerId);
        if (!purchase) throw new NotFoundException(`Purchase ${id} not found`);
        return purchase;
    }

    async createPurchase(dto: CreatePurchaseDto, user: User) {
        // Enforce RBAC: non-super-admins can only create for their own ownerId
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : dto.ownerId;
        if (!ownerId) throw new ForbiddenException('Unable to determine owner');

        // Calculate total from items
        const totalAmount = dto.items.reduce((sum, item) => sum + (item.price ?? 0), 0);

        const purchase = this.purchasesRepository.create({
            ownerId,
            purchaseDate: new Date(dto.purchaseDate),
            supplierId: dto.supplierId ?? null,
            invoiceNumber: dto.invoiceNumber ?? null,
            healthStatus: dto.healthStatus ?? null,
            notes: dto.notes ?? null,
            totalAmount,
        });

        const savedPurchase = await this.purchasesRepository.save(purchase);

        // Create items
        const itemRepo = this.purchasesRepository.getPurchaseItemRepo();
        for (const itemDto of dto.items) {
            const item = itemRepo.create({
                purchaseId: savedPurchase.id,
                cattleId: itemDto.cattleId,
                price: itemDto.price,
                weightAtPurchase: itemDto.weightAtPurchase ?? null,
                healthStatus: itemDto.healthStatus ?? null,
            });
            await itemRepo.save(item);

            // Update the cattle's source purchase info
            const ds = this.purchasesRepository.getDataSource();
            await ds.query(
                `UPDATE cattle SET source_type='ACHETE', source_supplier_id=$1, source_purchase_date=$2, source_purchase_price=$3, source_purchase_weight=$4, source_purchase_health_status=$5 WHERE id=$6`,
                [
                    dto.supplierId ?? null,
                    dto.purchaseDate,
                    itemDto.price,
                    itemDto.weightAtPurchase ?? null,
                    itemDto.healthStatus ?? null,
                    itemDto.cattleId,
                ]
            );
        }

        return this.purchasesRepository.findOnePurchase(savedPurchase.id);
    }

    async updatePurchase(id: string, dto: UpdatePurchaseDto, user: User) {
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : undefined;
        const purchase = await this.purchasesRepository.findOnePurchase(id, ownerId);
        if (!purchase) throw new NotFoundException(`Purchase ${id} not found`);

        if (dto.purchaseDate) purchase.purchaseDate = new Date(dto.purchaseDate);
        if (dto.supplierId !== undefined) purchase.supplierId = dto.supplierId;
        if (dto.invoiceNumber !== undefined) purchase.invoiceNumber = dto.invoiceNumber;
        if (dto.healthStatus !== undefined) purchase.healthStatus = dto.healthStatus;
        if (dto.notes !== undefined) purchase.notes = dto.notes;

        if (dto.items) {
            const itemRepo = this.purchasesRepository.getPurchaseItemRepo();
            // Remove old items
            await itemRepo.delete({ purchaseId: id });
            // Add new items
            let totalAmount = 0;
            for (const itemDto of dto.items) {
                const item = itemRepo.create({
                    purchaseId: id,
                    cattleId: itemDto.cattleId,
                    price: itemDto.price,
                    weightAtPurchase: itemDto.weightAtPurchase ?? null,
                    healthStatus: itemDto.healthStatus ?? null,
                });
                await itemRepo.save(item);
                totalAmount += itemDto.price ?? 0;
            }
            purchase.totalAmount = totalAmount;
        }

        await this.purchasesRepository.save(purchase);
        return this.purchasesRepository.findOnePurchase(id);
    }

    async removePurchase(id: string, user: User) {
        const ownerId = user.role !== UserRole.SUPER_ADMIN ? user.ownerId : undefined;
        const purchase = await this.purchasesRepository.findOnePurchase(id, ownerId);
        if (!purchase) throw new NotFoundException(`Purchase ${id} not found`);
        await this.purchasesRepository.remove(purchase);
        return { message: 'Purchase deleted successfully' };
    }

    // ─── Suppliers ───────────────────────────────────────────────────────────────

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
