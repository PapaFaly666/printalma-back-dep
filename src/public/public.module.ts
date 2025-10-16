import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PrismaService } from '../prisma.service';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [ProductModule],
  controllers: [PublicController],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PublicModule {}