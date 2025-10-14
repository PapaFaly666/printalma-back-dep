import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, IsInt, Min, IsUrl } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Nom de la catégorie',
    example: 'Vêtements',
    required: false,
    minLength: 2,
    maxLength: 100
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description de la catégorie',
    example: 'Tous les vêtements personnalisables',
    required: false,
    maxLength: 500
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Ordre d\'affichage',
    example: 0,
    required: false
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'URL de l\'image de couverture',
    example: 'https://res.cloudinary.com/...',
    required: false
  })
  @IsUrl()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Public ID Cloudinary de l\'image de couverture',
    example: 'categories/vetements_abc123',
    required: false
  })
  @IsString()
  @IsOptional()
  coverImagePublicId?: string;
} 