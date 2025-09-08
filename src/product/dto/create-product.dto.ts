import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsArray, IsNotEmpty, ArrayMinSize, IsInt, IsEnum, IsOptional, ValidateNested, MinLength, MaxLength, IsObject, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

enum PublicationStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT'
}

// Enum pour le type de coordonnées
export enum CoordinateType {
  PERCENTAGE = 'PERCENTAGE',
  ABSOLUTE = 'ABSOLUTE'
}

export class CreateColorDto {
  @ApiProperty({ description: 'Nom de la couleur' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Code hexadécimal de la couleur (optionnel)', required: false })
  @IsOptional()
  @IsString()
  hexCode?: string;

  @ApiProperty({ description: 'URL de l\'image de la couleur (requis si pas de fichier image)', required: false })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({ description: 'ID public de l\'image sur Cloudinary (optionnel)', required: false })
  @IsOptional()
  @IsString()
  imagePublicId?: string;
}

export class CustomDesignDto {
  @ApiProperty({ description: 'Nom du design' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description du design (optionnel)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Nom du fichier image pour le design' })
  @IsOptional()
  @IsString()
  image?: string;
}

export class DelimitationDto {
  @ApiProperty({ description: 'Coordonnée X (0-100% pour PERCENTAGE, pixels pour ABSOLUTE)' })
  @IsNumber()
  @Min(0)
  x: number;

  @ApiProperty({ description: 'Coordonnée Y (0-100% pour PERCENTAGE, pixels pour ABSOLUTE)' })
  @IsNumber()
  @Min(0)
  y: number;

  @ApiProperty({ description: 'Largeur (0-100% pour PERCENTAGE, pixels pour ABSOLUTE)' })
  @IsNumber()
  @IsPositive()
  width: number;

  @ApiProperty({ description: 'Hauteur (0-100% pour PERCENTAGE, pixels pour ABSOLUTE)' })
  @IsNumber()
  @IsPositive()
  height: number;
  
  @ApiProperty({ description: 'Angle de rotation en degrés', required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  rotation?: number = 0;

  @ApiProperty({ description: 'Nom de la zone de délimitation', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'Type de coordonnées utilisées',
    enum: CoordinateType,
    required: false
  })
  @IsEnum(CoordinateType)
  @IsOptional()
  coordinateType?: CoordinateType = CoordinateType.PERCENTAGE;

  // Champs pour la migration depuis coordonnées absolues
  @ApiProperty({ description: 'Ancienne coordonnée X absolue', required: false })
  @IsOptional()
  @IsNumber()
  absoluteX?: number;

  @ApiProperty({ description: 'Ancienne coordonnée Y absolue', required: false })
  @IsOptional()
  @IsNumber()
  absoluteY?: number;

  @ApiProperty({ description: 'Ancienne largeur absolue', required: false })
  @IsOptional()
  @IsNumber()
  absoluteWidth?: number;

  @ApiProperty({ description: 'Ancienne hauteur absolue', required: false })
  @IsOptional()
  @IsNumber()
  absoluteHeight?: number;

  @ApiProperty({ description: 'Largeur image originale', required: false })
  @IsOptional()
  @IsNumber()
  originalImageWidth?: number;

  @ApiProperty({ description: 'Hauteur image originale', required: false })
  @IsOptional()
  @IsNumber()
  originalImageHeight?: number;
}

export class ProductImageDto {
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

  @ApiProperty({ 
    description: 'Zones de personnalisation sur cette image',
    type: () => [DelimitationDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DelimitationDto)
  delimitations?: DelimitationDto[] = [];
}

export class ColorVariationDto {
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
    type: () => [ProductImageDto]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une image est requise par couleur' })
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images: ProductImageDto[];
}

export class CreateProductDto {
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
    description: 'Prix suggéré du produit (optionnel)',
    example: 8500,
    required: false
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  suggestedPrice?: number;

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
    description: 'Indique si le produit est prêt (true) ou un mockup (false)',
    example: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isReadyProduct?: boolean = false;

  @ApiProperty({ 
    description: 'Genre du produit (public cible)',
    enum: ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'],
    example: 'UNISEXE',
    required: false
  })
  @IsOptional()
  @IsEnum(['HOMME', 'FEMME', 'BEBE', 'UNISEXE'], { 
    message: 'Le genre doit être "HOMME", "FEMME", "BEBE" ou "UNISEXE"' 
  })
  genre?: string = 'UNISEXE';

  @ApiProperty({ 
    description: 'Variations de couleur du produit',
    type: () => [ColorVariationDto]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une variation de couleur est requise' })
  @ValidateNested({ each: true })
  @Type(() => ColorVariationDto)
  colorVariations: ColorVariationDto[];
}

// Rétrocompatibilité - les anciens DTOs sont conservés mais dépréciés
export class CustomColorDto {
  @ApiProperty({ description: 'Nom de la couleur' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Code hexadécimal de la couleur' })
  @IsString()
  hexCode: string;

  @ApiProperty({ description: 'URL de l\'image de la couleur (optionnel)' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}