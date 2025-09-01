import { Module } from '@nestjs/common';
import { ThemeService } from './theme.service';
import { ThemeController } from './theme.controller';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';

@Module({
  controllers: [ThemeController],
  providers: [ThemeService, PrismaService, CloudinaryService],
  exports: [ThemeService]
})
export class ThemeModule {} 