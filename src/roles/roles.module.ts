import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController, PermissionsController } from './roles.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [RolesController, PermissionsController],
  providers: [RolesService, PrismaService],
  exports: [RolesService],
})
export class RolesModule {}
