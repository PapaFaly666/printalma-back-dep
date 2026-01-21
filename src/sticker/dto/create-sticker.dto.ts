import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max, IsEnum, IsInt, MinLength, MaxLength, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export enum StickerShape {
  SQUARE = 'SQUARE',
  CIRCLE = 'CIRCLE',
  RECTANGLE = 'RECTANGLE',
  DIE_CUT = 'DIE_CUT',
}

export class StickerSizeDto {
  @ApiProperty({ example: 10, description: 'Largeur en cm' })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({ example: 10, description: 'Hauteur en cm' })
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

  @ApiProperty({
    example: 'glossy',
    description: 'Finition du sticker (optionnel)',
    required: false
  })
  @IsOptional()
  @IsString()
  finish?: string;

  @ApiProperty({ example: 'DIE_CUT', enum: StickerShape })
  @IsEnum(StickerShape)
  shape: StickerShape;

  @ApiProperty({
    example: 2500,
    description: 'Prix de vente en FCFA (défini par le vendeur)',
    minimum: 100,
    maximum: 100000
  })
  @IsInt()
  @IsPositive()
  @Min(100)
  @Max(100000)
  price: number;

  @ApiProperty({
    example: 1,
    description: 'Quantité minimale par commande (minimum 1)',
    minimum: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'La quantité minimale doit être au moins 1' })
  minQuantity?: number;

  @ApiProperty({
    example: 100,
    description: 'Quantité maximale par commande',
    minimum: 1,
    maximum: 10000,
    default: 100
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  maxQuantity?: number;

  @ApiProperty({
    example: 'autocollant',
    description: 'Type de sticker: autocollant (bordure fine) ou pare-chocs (bordure large)',
    enum: ['autocollant', 'pare-chocs']
  })
  @IsOptional()
  @IsString()
  stickerType?: 'autocollant' | 'pare-chocs';

  @ApiProperty({
    example: 'glossy-white',
    description: 'Couleur de la bordure: white, glossy-white, matte-white, transparent',
    required: false
  })
  @IsOptional()
  @IsString()
  borderColor?: string;
}
