import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateStickerDto } from './create-sticker.dto';

export enum StickerProductStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
}

export class UpdateStickerDto extends PartialType(
  OmitType(CreateStickerDto, ['designId', 'size', 'finish', 'shape'] as const)
) {
  @ApiProperty({ enum: StickerProductStatus, required: false })
  @IsOptional()
  @IsEnum(StickerProductStatus)
  status?: StickerProductStatus;
}
