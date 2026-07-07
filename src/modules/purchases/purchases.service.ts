import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { PurchasesRepository } from './purchases.repository';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Cattle, SourceType } from '../cattle/entities/cattle.entity';
import { resolveOwnerIdFromUser } from '../../common/utils/rbac.util';

@Injectable()
export class PurchasesService {
    constructor(private readonly purchasesRepository: PurchasesRepository) {}

    // ─── Purchases ──────────────────────────────────────────────────────────────

    async findAllPurchases(query: any, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, query.ownerId, 'purchases');

        return this.purchasesRepository.findAllPurchases({
            ownerId,
            supplierId: query.supplierId,
            page: query.page ? Number(query.page) : 1,
            per_page: query.per_page ? Number(query.per_page) : 20,
        });
    }

    async findOnePurchase(id: string, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'purchase');
        const purchase = await this.purchasesRepository.findOnePurchase(id, ownerId);
        if (!purchase) throw new NotFoundException(`Purchase ${id} not found`);
        return purchase;
    }

    async createPurchase(dto: CreatePurchaseDto, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, dto.ownerId, 'purchases');

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

        // Create items and update cattle source info via ORM (inside one transaction)
        const ds = this.purchasesRepository.getDataSource();
        await ds.transaction(async (em) => {
            const itemRepo = em.getRepository(PurchaseItem);
            for (const itemDto of dto.items) {
                const item = itemRepo.create({
                    purchaseId: savedPurchase.id,
                    cattleId: itemDto.cattleId,
                    price: itemDto.price,
                    weightAtPurchase: itemDto.weightAtPurchase ?? null,
                    healthStatus: itemDto.healthStatus ?? null,
                });
                await itemRepo.save(item);

                // Update cattle source info via ORM — no raw SQL
                await em.getRepository(Cattle).update(itemDto.cattleId, {
                    sourceType: SourceType.ACHETE,
                    sourceSupplier: dto.supplierId ?? null,
                    sourcePurchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
                    sourcePurchasePrice: itemDto.price,
                    sourcePurchaseWeight: itemDto.weightAtPurchase ?? null,
                    sourcePurchaseHealthStatus: itemDto.healthStatus ?? null,
                });
            }
        });

        return this.purchasesRepository.findOnePurchase(savedPurchase.id);
    }

    async updatePurchase(id: string, dto: UpdatePurchaseDto, user: User) {
        const ownerId = resolveOwnerIdFromUser(user, null, 'purchase');
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
        const ownerId = resolveOwnerIdFromUser(user, null, 'purchase');
        const purchase = await this.purchasesRepository.findOnePurchase(id, ownerId);
        if (!purchase) throw new NotFoundException(`Purchase ${id} not found`);
        await this.purchasesRepository.remove(purchase);
        return { message: 'Purchase deleted successfully' };
    }
}
