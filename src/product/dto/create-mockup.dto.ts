import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsPositive, IsArray, IsNotEmpty, ArrayMinSize, IsInt, IsEnum, IsOptional, ValidateNested, MinLength, MaxLength, IsObject, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Enum pour le genre des mockups (utilise l'enum Prisma)
export enum MockupGenre {
  HOMME = 'HOMME',
  FEMME = 'FEMME',
  BEBE = 'BEBE',
  UNISEXE = 'UNISEXE'
}

// Enum pour le type de coordonnées
export enum CoordinateType {
  PERCENTAGE = 'PERCENTAGE',
  ABSOLUTE = 'ABSOLUTE'
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
}

export class ProductImageDto {
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

export class CreateMockupDto {
  @ApiProperty({ 
    description: 'Nom du mockup',
    example: 'T-Shirt Homme Classic'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  name: string;

  @ApiProperty({ 
    description: 'Description détaillée du mockup',
    example: 'T-shirt basique pour homme en coton'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'La description doit contenir au moins 10 caractères' })
  @MaxLength(5000, { message: 'La description ne peut pas dépasser 5000 caractères' })
  description: string;

  @ApiProperty({ 
    description: 'Prix du mockup (doit être supérieur à 0)',
    example: 5000
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
    description: 'Statut de publication du mockup',
    enum: ['published', 'draft'],
    example: 'draft',
    required: false
  })
  @IsEnum(['published', 'draft'], { 
    message: 'Le statut doit être "published" ou "draft"' 
  })
  @IsOptional()
  status: 'published' | 'draft' = 'draft';

  @ApiProperty({ 
    description: 'Indique si c\'est un produit prêt (doit être false pour les mockups)',
    example: false,
    required: false
  })
  @IsBoolean()
  @IsOptional()
  isReadyProduct?: boolean = false;

  @ApiProperty({ 
    description: 'Genre du mockup (public cible)',
    enum: MockupGenre,
    example: MockupGenre.HOMME,
    required: false
  })
  @IsEnum(MockupGenre, { 
    message: 'Le genre doit être "HOMME", "FEMME", "BEBE" ou "UNISEXE"' 
  })
  @IsOptional()
  genre?: MockupGenre = MockupGenre.UNISEXE;

  @ApiProperty({ 
    description: 'Liste des catégories du mockup',
    type: [String],
    example: ['T-shirts', 'Homme'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[] = [];

  @ApiProperty({ 
    description: 'Liste des tailles disponibles pour ce mockup',
    type: [String],
    example: ['S', 'M', 'L', 'XL'],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[] = [];

  @ApiProperty({ 
    description: 'Variations de couleur du mockup',
    type: () => [ColorVariationDto]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une variation de couleur est requise' })
  @ValidateNested({ each: true })
  @Type(() => ColorVariationDto)
  colorVariations: ColorVariationDto[];
}

// DTO pour la réponse des mockups
export class MockupResponseDto {
  @ApiProperty({ description: 'ID du mockup' })
  id: number;

  @ApiProperty({ description: 'Nom du mockup' })
  name: string;

  @ApiProperty({ description: 'Description du mockup' })
  description: string;

  @ApiProperty({ description: 'Prix du mockup' })
  price: number;

  @ApiProperty({ description: 'Statut du mockup' })
  status: 'published' | 'draft';

  @ApiProperty({ description: 'Indique si c\'est un produit prêt' })
  isReadyProduct: boolean;

  @ApiProperty({ 
    description: 'Genre du mockup',
    enum: MockupGenre
  })
  genre: MockupGenre;

  @ApiProperty({ description: 'Catégories du mockup' })
  categories: any[];

  @ApiProperty({ description: 'Variations de couleur' })
  colorVariations: any[];

  @ApiProperty({ description: 'Tailles disponibles' })
  sizes: any[];

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;
}

// DTO pour la mise à jour des mockups
export class UpdateMockupDto {
  @ApiProperty({ 
    description: 'Nom du mockup',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(255, { message: 'Le nom ne peut pas dépasser 255 caractères' })
  name?: string;

  @ApiProperty({ 
    description: 'Description du mockup',
    required: false
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'La description doit contenir au moins 10 caractères' })
  @MaxLength(5000, { message: 'La description ne peut pas dépasser 5000 caractères' })
  description?: string;

  @ApiProperty({ 
    description: 'Prix du mockup',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @IsPositive({ message: 'Le prix doit être supérieur à 0' })
  @Type(() => Number)
  price?: number;

  @ApiProperty({ 
    description: 'Statut de publication',
    enum: ['published', 'draft'],
    required: false
  })
  @IsOptional()
  @IsEnum(['published', 'draft'], { 
    message: 'Le statut doit être "published" ou "draft"' 
  })
  status?: 'published' | 'draft';

  @ApiProperty({ 
    description: 'Genre du mockup',
    enum: MockupGenre,
    required: false
  })
  @IsOptional()
  @IsEnum(MockupGenre, { 
    message: 'Le genre doit être "HOMME", "FEMME", "BEBE" ou "UNISEXE"' 
  })
  genre?: MockupGenre;

  @ApiProperty({ 
    description: 'Liste des catégories',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiProperty({ 
    description: 'Liste des tailles',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[];

  @ApiProperty({ 
    description: 'Variations de couleur',
    type: () => [ColorVariationDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorVariationDto)
  colorVariations?: ColorVariationDto[];
} 