import { Module } from '@nestjs/common';
import { StickerService } from './sticker.service';
import { VendorStickerController } from './vendor-sticker.controller';
import { PublicStickerController } from './public-sticker.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [VendorStickerController, PublicStickerController],
  providers: [StickerService, PrismaService],
  exports: [StickerService],
})
export class StickerModule {}
