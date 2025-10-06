import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'Nom de la catégorie',
    example: 'T-Shirt',
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
    example: 'T-shirts personnalisables pour homme et femme',
    required: false,
    maxLength: 500
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  @IsOptional()
  description?: string;
} 