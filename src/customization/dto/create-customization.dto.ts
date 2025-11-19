import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsObject, ValidateNested, IsIn, Min, Max, Matches } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// DTO pour un élément de texte
export class TextElementDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ['text'] })
  type: 'text';

  @ApiProperty()
  @IsNumber()
  x: number;

  @ApiProperty()
  @IsNumber()
  y: number;

  @ApiProperty()
  @IsNumber()
  width: number;

  @ApiProperty()
  @IsNumber()
  height: number;

  @ApiProperty()
  @IsNumber()
  rotation: number;

  @ApiProperty()
  @IsNumber()
  zIndex: number;

  @ApiProperty()
  @IsString()
  text: string;

  @ApiProperty()
  @IsNumber()
  fontSize: number;

  @ApiProperty()
  @IsNumber()
  baseFontSize: number;

  @ApiProperty()
  @IsNumber()
  baseWidth: number;

  @ApiProperty()
  @IsString()
  fontFamily: string;

  @ApiProperty()
  @IsString()
  color: string;

  @ApiProperty({ enum: ['normal', 'bold'] })
  fontWeight: 'normal' | 'bold';

  @ApiProperty({ enum: ['normal', 'italic'] })
  fontStyle: 'normal' | 'italic';

  @ApiProperty({ enum: ['none', 'underline'] })
  textDecoration: 'none' | 'underline';

  @ApiProperty({ enum: ['left', 'center', 'right'] })
  textAlign: 'left' | 'center' | 'right';

  @ApiProperty()
  @IsNumber()
  curve: number;
}

// DTO pour un élément d'image
export class ImageElementDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty({ enum: ['image'] })
  type: 'image';

  @ApiProperty()
  @IsNumber()
  x: number;

  @ApiProperty()
  @IsNumber()
  y: number;

  @ApiProperty()
  @IsNumber()
  width: number;

  @ApiProperty()
  @IsNumber()
  height: number;

  @ApiProperty()
  @IsNumber()
  rotation: number;

  @ApiProperty()
  @IsNumber()
  zIndex: number;

  @ApiProperty()
  @IsString()
  imageUrl: string;

  @ApiProperty()
  @IsNumber()
  naturalWidth: number;

  @ApiProperty()
  @IsNumber()
  naturalHeight: number;
}

// DTO pour une sélection de taille
export class SizeSelectionDto {
  @ApiProperty()
  @IsString()
  size: string;

  @ApiProperty()
  @IsNumber()
  quantity: number;
}

// DTO principal - Compatible avec la doc complète
export class CreateCustomizationDto {
  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  productId: number;

  @ApiPropertyOptional({ description: 'ID du produit vendeur (optionnel)' })
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  vendorProductId?: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  colorVariationId: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  viewId: number;

  // Format simple: Array d'éléments
  @ApiPropertyOptional({
    type: [Object],
    description: 'Array of DesignElement (format simple - une seule vue)'
  })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value, { toClassOnly: true }) // Préserver les données brutes sans transformation
  designElements?: any[];

  // Format multi-vues: Object {"colorId-viewId": Array<DesignElement>}
  @ApiPropertyOptional({
    type: Object,
    description: 'Object mapping viewKey to DesignElement array (format multi-vues)'
  })
  @IsObject()
  @IsOptional()
  @Transform(({ value }) => value, { toClassOnly: true }) // Préserver les données brutes sans transformation
  elementsByView?: Record<string, any[]>;

  // Délimitations de zones
  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  delimitations?: any[];

  // Sélections de taille
  @ApiPropertyOptional({ type: [SizeSelectionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SizeSelectionDto)
  sizeSelections?: SizeSelectionDto[];

  // Session guest
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionId?: string;

  // Preview image
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previewImageUrl?: string;

  // Timestamp du client
  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  timestamp?: number;
}

export class UpdateCustomizationDto {
  @ApiPropertyOptional({ type: [Object] })
  @IsArray()
  @IsOptional()
  designElements?: (TextElementDto | ImageElementDto)[];

  @ApiPropertyOptional({ type: [SizeSelectionDto] })
  @IsArray()
  @IsOptional()
  sizeSelections?: SizeSelectionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previewImageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  status?: string;
}
