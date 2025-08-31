import { Module } from '@nestjs/common';
import { ProductViewService } from './product-view.service';
import { ProductViewController } from './product-view.controller';
import { PrismaService } from 'prisma.service';
import { CloudinaryService } from 'src/core/cloudinary/cloudinary.service';

@Module({
  providers: [ProductViewService, PrismaService, CloudinaryService],
  controllers: [ProductViewController]
})
export class ProductViewModule {}
