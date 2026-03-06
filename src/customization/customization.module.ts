import { Module } from '@nestjs/common';
import { CustomizationController } from './customization.controller';
import { CustomizationService } from './customization.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';
import { CleanupClientImagesTask } from './tasks/cleanup-client-images.task';
import { OrderMockupGeneratorService } from '../order/services/order-mockup-generator.service';
import { ProductPreviewGeneratorService } from '../vendor-product/services/product-preview-generator.service';
import { MailModule } from '../core/mail/mail.module';

@Module({
  imports: [
    CloudinaryModule,
    MailModule, // 📧 Pour envoyer des emails
  ],
  controllers: [CustomizationController],
  providers: [
    CustomizationService,
    PrismaService,
    CleanupClientImagesTask,
    OrderMockupGeneratorService, // 🎨 Pour générer les mockups multi-éléments
    ProductPreviewGeneratorService, // 🎨 Pour générer les mockups avec Sharp (système robuste vendeurs)
  ],
  exports: [CustomizationService]
})
export class CustomizationModule {}
