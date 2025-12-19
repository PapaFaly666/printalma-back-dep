import { Module } from '@nestjs/common';
import { SuperadminDashboardController } from './superadmin-dashboard.controller';
import { SuperadminDashboardService } from './superadmin-dashboard.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SuperadminDashboardController],
  providers: [SuperadminDashboardService, PrismaService],
  exports: [SuperadminDashboardService],
})
export class SuperadminDashboardModule {}
