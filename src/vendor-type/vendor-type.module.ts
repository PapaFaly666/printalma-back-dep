import { Module } from '@nestjs/common';
import { VendorTypeService } from './vendor-type.service';
import { VendorTypeController } from './vendor-type.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [VendorTypeController],
  providers: [VendorTypeService, PrismaService],
  exports: [VendorTypeService],
})
export class VendorTypeModule {}
