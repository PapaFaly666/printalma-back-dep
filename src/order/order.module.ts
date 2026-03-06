import { Module, forwardRef } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderGateway } from './order.gateway';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';
import { JwtModule } from '@nestjs/jwt';
import { RealBestSellersService } from '../vendor-product/services/real-best-sellers.service';
import { SalesStatsUpdaterService } from '../vendor-product/services/sales-stats-updater.service';
import { PaytechService } from '../paytech/paytech.service';
import { PaydunyaModule } from '../paydunya/paydunya.module';
import { ConfigModule } from '@nestjs/config';
import { CustomizationModule } from '../customization/customization.module';
import { VendorFundsModule } from '../vendor-funds/vendor-funds.module';
import { MailModule } from '../core/mail/mail.module';
import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';
import { OrderMockupGeneratorService } from './services/order-mockup-generator.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    ConfigModule,
    forwardRef(() => PaydunyaModule),
    CustomizationModule, // 🎨 Module de personnalisation
    VendorFundsModule, // Module de gestion des fonds vendeur
    MailModule, // 📧 Module d'envoi d'emails
    CloudinaryModule, // 📤 Module d'upload d'images
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderGateway,
    PrismaService,
    NotificationService,
    RealBestSellersService,
    SalesStatsUpdaterService,
    PaytechService,
    OrderMockupGeneratorService, // 🎨 Service de génération de mockups
  ],
  exports: [OrderService, OrderGateway, OrderMockupGeneratorService],
})
export class OrderModule {} 