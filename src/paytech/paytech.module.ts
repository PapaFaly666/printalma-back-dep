import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaytechService } from './paytech.service';
import { PaytechController } from './paytech.controller';
import { JwtModule } from '@nestjs/jwt';
import { OrderService } from '../order/order.service';
import { PrismaService } from '../prisma.service';
import { SalesStatsUpdaterService } from '../vendor-product/services/sales-stats-updater.service';
import { RealBestSellersService } from '../vendor-product/services/real-best-sellers.service';

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
  ],
  controllers: [PaytechController],
  providers: [
    PaytechService,
    OrderService,
    PrismaService,
    SalesStatsUpdaterService,
    RealBestSellersService,
  ],
  exports: [PaytechService], // Export service for use in other modules
})
export class PaytechModule {}
