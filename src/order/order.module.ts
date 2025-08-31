import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderGateway } from './order.gateway';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';
import { JwtModule } from '@nestjs/jwt';
import { RealBestSellersService } from '../vendor-product/services/real-best-sellers.service';
import { SalesStatsUpdaterService } from '../vendor-product/services/sales-stats-updater.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [OrderController],
  providers: [
    OrderService, 
    OrderGateway, 
    PrismaService, 
    NotificationService,
    RealBestSellersService,
    SalesStatsUpdaterService,
  ],
  exports: [OrderService, OrderGateway],
})
export class OrderModule {} 