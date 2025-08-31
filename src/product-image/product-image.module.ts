import { Module } from '@nestjs/common';
import { ProductImageController } from './product-image.controller';
import { ProductImageService } from '../services/product-image.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
// Assuming a CloudinaryModule exists that provides CloudinaryService
// import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';

@Module({
  // imports: [CloudinaryModule], // Uncomment if you have a CloudinaryModule
  controllers: [ProductImageController],
  providers: [ProductImageService, PrismaService, CloudinaryService],
})
export class ProductImageModule {} 