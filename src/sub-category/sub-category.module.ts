import { Module } from '@nestjs/common';
import { SubCategoryController } from './sub-category.controller';
import { SubCategoryService } from './sub-category.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SubCategoryController],
  providers: [SubCategoryService, PrismaService],
  exports: [SubCategoryService]
})
export class SubCategoryModule {}
