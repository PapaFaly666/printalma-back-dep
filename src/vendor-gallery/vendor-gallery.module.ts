import { Module } from '@nestjs/common';
import { VendorGalleryController } from './vendor-gallery.controller';
import { PublicGalleryController } from './public-gallery.controller';
import { SingleGalleryController } from './single-gallery.controller';
import { PublicVendorGalleryController } from './public-vendor-gallery.controller';
import { VendorGalleryService } from './vendor-gallery.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Module({
  controllers: [
    VendorGalleryController,
    PublicGalleryController,
    SingleGalleryController,
    PublicVendorGalleryController,
  ],
  providers: [VendorGalleryService, PrismaService, CloudinaryService],
  exports: [VendorGalleryService],
})
export class VendorGalleryModule {}
