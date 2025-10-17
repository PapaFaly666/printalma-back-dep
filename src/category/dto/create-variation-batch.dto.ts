import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsInt, Min, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVariationDto {
  @ApiProperty({
    description: 'Nom de la variation',
    example: 'Col V'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'ID de la sous-catégorie parente',
    example: 6
  })
  @IsInt()
  @Min(1)
  parentId: number;

  @ApiProperty({
    description: 'Niveau de la variation (doit être 2 pour les variations)',
    example: 2,
    default: 2
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  level?: number;

  @ApiProperty({
    description: 'Description de la variation',
    example: 'Col en forme de V',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateVariationBatchDto {
  @ApiProperty({
    description: 'Tableau des variations à créer',
    type: [CreateVariationDto],
    example: [
      { name: 'Col V', parentId: 6, level: 2 },
      { name: 'Col Rond', parentId: 6, level: 2 },
      { name: 'Col Polo', parentId: 6, level: 2 },
      { name: 'Manches Longues', parentId: 6, level: 2 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariationDto)
  variations: CreateVariationDto[];
}

export class VariationResponseDto {
  @ApiProperty({ description: 'ID de la variation créée' })
  id: number;

  @ApiProperty({ description: 'Nom de la variation' })
  name: string;

  @ApiProperty({ description: 'Slug de la variation' })
  slug: string;

  @ApiProperty({ description: 'ID de la sous-catégorie parente' })
  parentId: number;

  @ApiProperty({ description: 'Niveau de la variation' })
  level: number;

  @ApiProperty({ description: 'Ordre d\'affichage' })
  displayOrder: number;

  @ApiProperty({ description: 'Statut actif' })
  isActive: boolean;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;
}

export class BatchVariationResponseDto {
  @ApiProperty({ description: 'Succès de l\'opération' })
  success: boolean;

  @ApiProperty({ description: 'Message informatif' })
  message: string;

  @ApiProperty({
    description: 'Résultats détaillés',
    type: 'object',
    example: {
      created: [VariationResponseDto],
      skipped: ['Col Rond'],
      duplicates: [{ name: 'Col Rond', reason: 'Cette variation existe déjà' }]
    }
  })
  data: {
    created: VariationResponseDto[];
    skipped: string[];
    duplicates: Array<{ name: string; reason: string }>;
  };
}