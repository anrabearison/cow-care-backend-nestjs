import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Supplier } from './entities/supplier.entity';
import { PurchasesRepository } from './purchases.repository';
import { PurchasesService } from './purchases.service';
import { PurchasesController, SuppliersController } from './purchases.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase, PurchaseItem, Supplier]),
    ],
    controllers: [PurchasesController, SuppliersController],
    providers: [PurchasesService, PurchasesRepository],
    exports: [PurchasesService],
})
export class PurchasesModule {}
