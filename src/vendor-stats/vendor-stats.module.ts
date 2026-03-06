import { Module } from '@nestjs/common';
import { VendorStatsController } from './vendor-stats.controller';
import { VendorStatsService } from './vendor-stats.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [VendorStatsController],
  providers: [VendorStatsService, PrismaService],
  exports: [VendorStatsService],
})
export class VendorStatsModule {}
