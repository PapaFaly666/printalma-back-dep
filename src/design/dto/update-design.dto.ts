import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength, IsNumber, Min, Max, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { DesignCategory } from './create-design.dto';

export class UpdateDesignDto {
  @ApiProperty({
    description: 'Nom du design',
    example: 'Logo moderne entreprise',
    minLength: 3,
    maxLength: 255,
    required: false
  })
  @IsOptional()
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(3, { message: 'Le nom doit contenir au moins 3 caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiProperty({
    description: 'Description du design',
    example: 'Un logo épuré et moderne pour entreprises tech',
    required: false,
    maxLength: 1000
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(1000, { message: 'La description ne peut pas dépasser 1000 caractères' })
  @Transform(({ value }) => value?.trim())
  description?: string;

  @ApiProperty({
    description: 'Prix en FCFA',
    example: 2500,
    minimum: 100,
    maximum: 1000000,
    required: false
  })
  @IsOptional()
  @IsNumber({}, { message: 'Le prix doit être un nombre' })
  @Min(100, { message: 'Le prix minimum est de 100 FCFA' })
  @Max(1000000, { message: 'Le prix maximum est de 1,000,000 FCFA' })
  @Transform(({ value }) => parseInt(value))
  price?: number;

  @ApiProperty({
    description: 'Catégorie du design',
    enum: DesignCategory,
    example: DesignCategory.LOGO,
    required: false
  })
  @IsOptional()
  @IsEnum(DesignCategory, { message: 'Catégorie invalide' })
  category?: DesignCategory;

  @ApiProperty({
    description: 'Tags optionnels (séparés par des virgules)',
    example: 'moderne,entreprise,tech',
    required: false
  })
  @IsOptional()
  @IsString()
  tags?: string;
} 