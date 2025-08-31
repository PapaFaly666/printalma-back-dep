import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddProductsToThemeDto {
  @ApiProperty({
    description: 'Liste des IDs des produits à ajouter au thème',
    example: [1, 2, 3],
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  productIds: number[];

  @ApiProperty({
    description: 'Filtrer par statut des produits (optionnel)',
    example: 'READY',
    required: false,
    enum: ['DRAFT', 'PUBLISHED', 'READY']
  })
  @IsOptional()
  @IsString()
  productStatus?: string;

  @ApiProperty({
    description: 'Filtrer par catégorie de produits (optionnel)',
    example: 'tshirt',
    required: false
  })
  @IsOptional()
  @IsString()
  category?: string;
} 