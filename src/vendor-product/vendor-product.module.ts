import { Module } from '@nestjs/common';
import { VendorPublishController } from './vendor-publish.controller';
import { VendorPublishService } from './vendor-publish.service';
import { VendorProductValidationController } from './vendor-product-validation.controller';
import { VendorProductValidationService } from './vendor-product-validation.service';
import { VendorDesignProductsController } from './vendor-design-products.controller';
import { VendorWizardController } from './vendor-wizard.controller';
import { VendorWizardService } from './vendor-wizard.service';
import { VendorWizardProductController } from './vendor-wizard-product.controller';
import { VendorWizardProductService } from './vendor-wizard-product.service';
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
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { DesignPositionService } from './services/design-position.service';
import { MailService } from '../core/mail/mail.service';

@Module({
  controllers: [
    VendorPublishController,
    VendorProductValidationController,
    VendorDesignProductsController,
    VendorWizardController,
    VendorWizardProductController,
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
    VendorProductValidationService,
    VendorWizardService,
    VendorWizardProductService,
    BestSellersService,
    RealBestSellersService,
    SalesStatsUpdaterService,
    PrismaService,
    CloudinaryService,
    DesignPositionService,
    MailService,
  ],
  exports: [
    VendorPublishService,
    VendorWizardProductService,
    BestSellersService,
    RealBestSellersService,
    SalesStatsUpdaterService,
  ],
})
export class VendorProductModule {} 