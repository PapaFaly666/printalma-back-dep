import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, IsEnum, IsInt, MinLength, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export enum StickerShape {
  SQUARE = 'SQUARE',
  CIRCLE = 'CIRCLE',
  RECTANGLE = 'RECTANGLE',
  DIE_CUT = 'DIE_CUT',
}

export class StickerSizeDto {
  @ApiProperty({ example: 'medium' })
  @IsString()
  id: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(1)
  height: number;
}

export class CreateStickerDto {
  @ApiProperty({ example: 123 })
  @IsInt()
  @Min(1)
  designId: number;

  @ApiProperty({ example: 'Sticker Logo Entreprise' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Sticker personnalisé avec logo entreprise en haute qualité',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ type: StickerSizeDto })
  @Type(() => StickerSizeDto)
  size: StickerSizeDto;

  @ApiProperty({ example: 'glossy' })
  @IsString()
  finish: string;

  @ApiProperty({ example: 'DIE_CUT', enum: StickerShape })
  @IsEnum(StickerShape)
  shape: StickerShape;

  @ApiProperty({ example: 1100 })
  @IsInt()
  @Min(500)
  price: number;

  @ApiProperty({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minimumQuantity?: number;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  stockQuantity: number;
}
