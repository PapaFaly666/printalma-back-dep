import { Module } from '@nestjs/common';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AdminSettingsController],
  providers: [AdminSettingsService, PrismaService],
  exports: [AdminSettingsService]
})
export class AdminSettingsModule {}
