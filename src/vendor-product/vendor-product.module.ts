import { Module } from '@nestjs/common';
import { VendorPublishController } from './vendor-publish.controller';
import { VendorPublishService } from './vendor-publish.service';
import { BestSellersController } from './best-sellers.controller';
import { BestSellersService } from './best-sellers.service';
import { PublicBestSellersController } from './public-best-sellers.controller';
import { PublicProductsController } from './public-products.controller';
import { SimplePublicProductsController } from './simple-public-products.controller';
import { AdvancedBestSellersController } from './advanced-best-sellers.controller';
import { PublicNewArrivalsController } from './public-new-arrivals.controller';
import { AdminBestSellersController } from './admin-best-sellers.controller';
import { RealBestSellersService } from './services/real-best-sellers.service';
import { SalesStatsUpdaterService } from './services/sales-stats-updater.service';
import { PrismaService } from '../../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { DesignPositionService } from './services/design-position.service';

@Module({
  controllers: [
    VendorPublishController,
    BestSellersController,
    PublicBestSellersController,
    PublicNewArrivalsController,
    PublicProductsController,
    SimplePublicProductsController,
    AdvancedBestSellersController,
    AdminBestSellersController,
  ],
  providers: [
    VendorPublishService,
    BestSellersService,
    RealBestSellersService,
    SalesStatsUpdaterService,
    PrismaService,
    CloudinaryService,
    DesignPositionService,
  ],
  exports: [
    VendorPublishService,
    BestSellersService,
    RealBestSellersService,
    SalesStatsUpdaterService,
  ],
})
export class VendorProductModule {} 