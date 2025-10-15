import { Module } from '@nestjs/common';
import { VariationController } from './variation.controller';
import { VariationService } from './variation.service';
import { PrismaService } from '../prisma.service';
import { MockupService } from '../product/services/mockup.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Module({
  controllers: [VariationController],
  providers: [VariationService, PrismaService, MockupService, CloudinaryService],
  exports: [VariationService]
})
export class VariationModule {}
