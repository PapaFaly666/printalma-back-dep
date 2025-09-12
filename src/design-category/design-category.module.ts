import { Module } from '@nestjs/common';
import { DesignCategoryController } from './design-category.controller';
import { DesignCategoryService } from './design-category.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [DesignCategoryController],
  providers: [DesignCategoryService, PrismaService],
  exports: [DesignCategoryService],
})
export class DesignCategoryModule {}