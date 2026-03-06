import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaytechService } from './paytech.service';
import { PaytechController } from './paytech.controller';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { SalesStatsUpdaterService } from '../vendor-product/services/sales-stats-updater.service';
import { RealBestSellersService } from '../vendor-product/services/real-best-sellers.service';
import { PaydunyaModule } from '../paydunya/paydunya.module';
import { CustomizationModule } from '../customization/customization.module';
import { MailModule } from '../core/mail/mail.module';
import { OrderModule } from '../order/order.module';

/**
 * PayTech Payment Module
 * Provides PayTech payment gateway integration
 *
 * Based on official PayTech documentation:
 * https://doc.intech.sn/doc_paytech.php
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    forwardRef(() => PaydunyaModule),
    forwardRef(() => OrderModule), // 📦 Import OrderModule pour OrderService et OrderMockupGeneratorService
    CustomizationModule, // 🎨 Module de personnalisation
    MailModule, // 📧 Module d'envoi d'emails
  ],
  controllers: [PaytechController],
  providers: [
    PaytechService,
    PrismaService,
    SalesStatsUpdaterService,
    RealBestSellersService,
  ],
  exports: [PaytechService], // Export service for use in other modules
})
export class PaytechModule {}
