import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma.service';
import { MockupService } from '../product/services/mockup.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService, MockupService, CloudinaryService]
})
export class CategoryModule {}
