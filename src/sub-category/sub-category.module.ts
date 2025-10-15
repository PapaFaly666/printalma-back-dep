import { Module } from '@nestjs/common';
import { SubCategoryController } from './sub-category.controller';
import { SubCategoryService } from './sub-category.service';
import { PrismaService } from '../prisma.service';
import { MockupService } from '../product/services/mockup.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Module({
  controllers: [SubCategoryController],
  providers: [SubCategoryService, PrismaService, MockupService, CloudinaryService],
  exports: [SubCategoryService]
})
export class SubCategoryModule {}
