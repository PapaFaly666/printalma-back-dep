import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, PermissionsGuard, PrismaService],
  exports: [PermissionsService, PermissionsGuard],
})
export class PermissionsModule {}
