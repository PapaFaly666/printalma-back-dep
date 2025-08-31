import { IsString, IsEnum, IsOptional, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

enum ViewType {
  FRONT = 'FRONT',
  BACK = 'BACK',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  TOP = 'TOP',
  BOTTOM = 'BOTTOM',
  DETAIL = 'DETAIL',
  OTHER = 'OTHER'
}

export class CreateProductViewDto {
  @ApiProperty({
    description: 'ID du produit auquel ajouter la vue',
    example: 1
  })
  @IsInt()
  productId: number;

  @ApiProperty({
    description: 'Type de vue',
    enum: ViewType,
    example: ViewType.FRONT
  })
  @IsEnum(ViewType)
  viewType: ViewType;

  @ApiProperty({
    description: 'Description de la vue (optionnelle)',
    example: 'Vue détaillée du col',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  // Le fichier image sera traité séparément par le contrôleur
}