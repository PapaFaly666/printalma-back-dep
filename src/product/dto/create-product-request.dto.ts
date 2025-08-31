import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, Min, Max, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';

// Enum pour le type de coordonnées
export enum CoordinateType {
  PERCENTAGE = 'PERCENTAGE',
  PIXEL = 'PIXEL',
  ABSOLUTE = 'ABSOLUTE', // Alias interne pour correspondre à Prisma (PIXEL ↔ ABSOLUTE)
}

export class DelimitationDto {
  @IsNumber()
  @Min(0, { message: 'Les coordonnées X doivent être positives' })
  @ValidateIf((o) => o.coordinateType === CoordinateType.PERCENTAGE || !o.coordinateType)
  @Max(100, { message: 'Les coordonnées X ne peuvent pas dépasser 100%' })
  x: number;

  @IsNumber()
  @Min(0, { message: 'Les coordonnées Y doivent être positives' })
  @ValidateIf((o) => o.coordinateType === CoordinateType.PERCENTAGE || !o.coordinateType)
  @Max(100, { message: 'Les coordonnées Y ne peuvent pas dépasser 100%' })
  y: number;

  @IsNumber()
  @Min(0.1, { message: 'La largeur doit être au moins 0.1 ou 0.1%' })
  @ValidateIf((o) => o.coordinateType === CoordinateType.PERCENTAGE || !o.coordinateType)
  @Max(100, { message: 'La largeur ne peut pas dépasser 100%' })
  width: number;

  @IsNumber()
  @Min(0.1, { message: 'La hauteur doit être au moins 0.1 ou 0.1%' })
  @ValidateIf((o) => o.coordinateType === CoordinateType.PERCENTAGE || !o.coordinateType)
  @Max(100, { message: 'La hauteur ne peut pas dépasser 100%' })
  height: number;

  @IsNumber()
  @IsOptional()
  @Min(-180, { message: 'La rotation doit être entre -180 et 180 degrés' })
  @Max(180, { message: 'La rotation doit être entre -180 et 180 degrés' })
  rotation?: number;

  @IsString()
  @IsOptional()
  name?: string; // Nom de la zone (ex: "Zone Poitrine", "Dos Complet")

  @IsEnum(CoordinateType)
  @IsOptional()
  coordinateType?: CoordinateType;

  // Champs pour la migration depuis coordonnées absolues
  @IsNumber()
  @IsOptional()
  absoluteX?: number;

  @IsNumber()
  @IsOptional()
  absoluteY?: number;

  @IsNumber()
  @IsOptional()
  absoluteWidth?: number;

  @IsNumber()
  @IsOptional()
  absoluteHeight?: number;

  @IsNumber()
  @IsOptional()
  originalImageWidth?: number;

  @IsNumber()
  @IsOptional()
  originalImageHeight?: number;

  @ValidateIf((o) => o.coordinateType === CoordinateType.PIXEL || o.coordinateType === CoordinateType.ABSOLUTE)
  @IsNumber()
  @Min(1, { message: 'La referenceWidth doit être supérieure à 0' })
  referenceWidth?: number;

  @ValidateIf((o) => o.coordinateType === CoordinateType.PIXEL || o.coordinateType === CoordinateType.ABSOLUTE)
  @IsNumber()
  @Min(1, { message: 'La referenceHeight doit être supérieure à 0' })
  referenceHeight?: number;
} 