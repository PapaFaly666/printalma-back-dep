import { Module } from '@nestjs/common';
import { ColorController } from './color.controller';
import { ColorService } from './color.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Module({
  controllers: [ColorController],
  providers: [ColorService, PrismaService, CloudinaryService]
})
export class ColorModule {}
