import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { PurchaseItem } from './entities/purchase-item.entity';
import { Supplier } from './entities/supplier.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { PurchasesRepository } from './purchases.repository';
import { PurchasesService } from './purchases.service';
import { SuppliersService } from './suppliers.service';
import { PurchasesController, SuppliersController } from './purchases.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase, PurchaseItem, Supplier, Organization]),
    ],
    controllers: [PurchasesController, SuppliersController],
    providers: [PurchasesService, SuppliersService, PurchasesRepository],
    exports: [PurchasesService, SuppliersService],
})
export class PurchasesModule {}
