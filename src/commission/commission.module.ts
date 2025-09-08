import { Module } from '@nestjs/common';
import { CommissionController } from './commission.controller';
import { VendorCommissionController } from './vendor-commission.controller';
import { CommissionService } from './commission.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [CommissionController, VendorCommissionController],
  providers: [CommissionService, PrismaService],
  exports: [CommissionService],
})
export class CommissionModule {}