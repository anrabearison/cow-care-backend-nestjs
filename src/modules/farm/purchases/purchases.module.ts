import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Supplier } from './entities/supplier.entity';
import { PurchasesRepository } from './purchases.repository';
import { PurchasesService } from './purchases.service';
import { SuppliersService } from './suppliers.service';
import { PurchasesController } from './purchases.controller';
import { SuppliersController } from './suppliers.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase, PurchaseItem, Supplier]),
    ],
    controllers: [PurchasesController, SuppliersController],
    providers: [PurchasesService, SuppliersService, PurchasesRepository],
    exports: [PurchasesService, SuppliersService],
})
export class PurchasesModule {}
