import { Module } from '@nestjs/common';
import { PublicUsersController } from './public-users.controller';
import { PublicVendorsController } from './public-vendors.controller';
import { PublicDesignsController } from './public-designs.controller';
import { PublicUsersService } from './public-users.service';
import { PublicDesignsService } from './services/public-designs.service';
import { VendorTypeService } from '../vendor-type/vendor-type.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PublicUsersController, PublicVendorsController, PublicDesignsController],
  providers: [PublicUsersService, PublicDesignsService, VendorTypeService, PrismaService],
  exports: [PublicUsersService]
})
export class PublicUsersModule {}