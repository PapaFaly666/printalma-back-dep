import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VendorFundsController } from './vendor-funds.controller';
import { AdminFundsController } from './admin-funds.controller';
import { VendorFundsService } from './vendor-funds.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [VendorFundsController, AdminFundsController],
  providers: [VendorFundsService, PrismaService],
  exports: [VendorFundsService],
})
export class VendorFundsModule {}