import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsArray, IsNotEmpty, ArrayMinSize, IsInt, IsEnum, IsOptional, ValidateNested, MinLength, MaxLength, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductGenre } from '@prisma/client';

// Enum pour le genre des produits prêts (utilise l'enum Prisma)
export enum ReadyProductGenre {
  HOMME = 'HOMME',
  FEMME = 'FEMME',
  BEBE = 'BEBE',
  UNISEXE = 'UNISEXE'
}

export class ReadyProductImageDto {
  @ApiProperty({ description: 'Identifiant unique du fichier image' })
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @ApiProperty({ 
    description: 'Vue de l\'image',
    enum: ['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom', 'Detail']
  })
  @IsEnum(['Front', 'Back', 'Left', 'Right', 'Top', 'Bottom', 'Detail'])
  view: string;
}

export class ReadyColorVariationDto {
  @ApiProperty({ description: 'Nom de la couleur' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Le nom de la couleur est requis' })
  @MaxLength(100, { message: 'Le nom de la couleur ne peut pas dépasser 100 caractères' })
  name: string;

  @ApiProperty({ 
    description: 'Code hexadécimal de la couleur (format #RRGGBB)',
    example: '#FF0000'
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => {
    // Validation du format hexadécimal
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(value)) {
      throw new Error('Le code couleur doit être au format #RRGGBB');
    }
    return value.toUpperCase();
  })
  colorCode: string;

  @ApiProperty({ 
    description: 'Images pour cette variation de couleur',
    type: () => [ReadyProductImageDto]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une image est requise par couleur' })
  @ValidateNested({ each: true })
  @Type(() => ReadyProductImageDto)
  images: ReadyProductImageDto[];
}

export class CreateReadyProductDto {
  @ApiProperty({ 
    description: 'Nom du produit',
    example: 'T-Shirt Premium en Coton Bio'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  name: string;

  @ApiProperty({ 
    description: 'Description détaillée du produit',
    example: 'Un t-shirt doux et résistant, parfait pour toutes les occasions'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'La description doit contenir au moins 10 caractères' })
  @MaxLength(5000, { message: 'La description ne peut pas dépasser 5000 caractères' })
  description: string;

  @ApiProperty({ 
    description: 'Prix du produit (doit être supérieur à 0)',
    example: 8500
  })
  @IsNumber()
  @IsPositive({ message: 'Le prix doit être supérieur à 0' })
  @Type(() => Number)
  price: number;

  @ApiProperty({ 
    description: 'Quantité en stock (optionnel, défaut: 0)',
    example: 150,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le stock ne peut pas être négatif' })
  @IsInt()
  @Type(() => Number)
  stock?: number = 0;

  @ApiProperty({ 
    description: 'Statut de publication du produit',
    enum: ['published', 'draft'],
    example: 'published'
  })
  @IsEnum(['published', 'draft'], { 
    message: 'Le statut doit être "published" ou "draft"' 
  })
  @IsOptional()
  status: 'published' | 'draft' = 'draft';

  @ApiProperty({ 
    description: 'Liste des catégories du produit',
    type: [String],
    example: ['T-shirts', 'Vêtements éco-responsables']
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'Au moins une catégorie est requise' })
  categories: string[];

  @ApiProperty({ 
    description: 'Liste des tailles disponibles pour ce produit',
    type: [String],
    example: ['S', 'M', 'L', 'XL'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[] = [];

  @ApiProperty({ 
    description: 'Variations de couleur du produit',
    type: () => [ReadyColorVariationDto]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une variation de couleur est requise' })
  @ValidateNested({ each: true })
  @Type(() => ReadyColorVariationDto)
  colorVariations: ReadyColorVariationDto[];

  @ApiProperty({ 
    description: 'Indique si c\'est un produit prêt (true) ou un mockup (false)',
    example: true,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isReadyProduct?: boolean; // ✅ Par défaut true pour les produits prêts

  @ApiProperty({ 
    description: 'Genre du produit prêt (public cible)',
    enum: ReadyProductGenre,
    example: ReadyProductGenre.HOMME,
    required: false
  })
  @IsEnum(ReadyProductGenre, { 
    message: 'Le genre doit être "HOMME", "FEMME", "BEBE" ou "UNISEXE"' 
  })
  @IsOptional()
  genre?: ReadyProductGenre;
} 
