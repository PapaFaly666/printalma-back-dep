import { Module } from '@nestjs/common';
import { StickerService } from './sticker.service';
import { VendorStickerController } from './vendor-sticker.controller';
import { PublicStickerController } from './public-sticker.controller';
import { PrismaService } from '../prisma.service';
import { StickerGeneratorService } from './services/sticker-generator.service';
import { StickerCloudinaryService } from './services/sticker-cloudinary.service';

@Module({
  controllers: [VendorStickerController, PublicStickerController],
  providers: [
    StickerService,
    PrismaService,
    StickerGeneratorService,
    StickerCloudinaryService,
  ],
  exports: [StickerService],
})
export class StickerModule {}
