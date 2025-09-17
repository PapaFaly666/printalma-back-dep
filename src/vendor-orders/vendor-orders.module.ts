import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VendorOrdersController } from './vendor-orders.controller';
import { VendorOrdersService } from './vendor-orders.service';
import { PrismaService } from '../prisma.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [VendorOrdersController],
  providers: [
    VendorOrdersService,
    PrismaService,
    NotificationService,
  ],
  exports: [VendorOrdersService],
})
export class VendorOrdersModule {}