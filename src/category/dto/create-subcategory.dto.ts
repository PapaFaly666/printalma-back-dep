import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, Max, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateSubCategoryDto {
  @ApiProperty({
    description: 'Nom de la sous-catégorie',
    example: 'T-Shirts'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description de la sous-catégorie',
    example: 'T-shirts en coton bio et tissus recyclés',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID de la catégorie parente',
    example: 4
  })
  @IsInt()
  @Min(1)
  categoryId: number;

  @ApiProperty({
    description: 'Alias pour categoryId (pour compatibilité)',
    example: 4,
    required: false
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  parentId?: number;

  @ApiProperty({
    description: 'Ordre d\'affichage (optionnel, calculé automatiquement si non fourni)',
    example: 0,
    required: false
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'Niveau de la sous-catégorie (doit être 1 pour les sous-catégories)',
    example: 1,
    default: 1
  })
  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  level?: number;
}

export class SubCategoryResponseDto {
  @ApiProperty({ description: 'ID de la sous-catégorie créée' })
  id: number;

  @ApiProperty({ description: 'Nom de la sous-catégorie' })
  name: string;

  @ApiProperty({ description: 'Slug de la sous-catégorie' })
  slug: string;

  @ApiProperty({ description: 'Description de la sous-catégorie' })
  description: string | null;

  @ApiProperty({ description: 'ID de la catégorie parente' })
  parentId: number;

  @ApiProperty({ description: 'Niveau de la sous-catégorie' })
  level: number;

  @ApiProperty({ description: 'Ordre d\'affichage' })
  display_order: number;

  @ApiProperty({ description: 'Statut actif' })
  is_active: boolean;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updated_at: Date;
}

export class CreateSubCategoryResponseDto {
  @ApiProperty({ description: 'Succès de l\'opération' })
  success: boolean;

  @ApiProperty({ description: 'Message informatif' })
  message: string;

  @ApiProperty({ description: 'Données de la sous-catégorie créée', type: SubCategoryResponseDto })
  data: SubCategoryResponseDto;
}