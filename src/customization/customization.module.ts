import { Module } from '@nestjs/common';
import { CustomizationController } from './customization.controller';
import { CustomizationService } from './customization.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryModule } from '../core/cloudinary/cloudinary.module';

@Module({
  imports: [CloudinaryModule],
  controllers: [CustomizationController],
  providers: [CustomizationService, PrismaService],
  exports: [CustomizationService]
})
export class CustomizationModule {}
