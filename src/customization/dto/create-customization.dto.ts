import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

// DTO principal
export class CreateCustomizationDto {
  @ApiProperty()
  @IsNumber()
  productId: number;

  @ApiProperty()
  @IsNumber()
  colorVariationId: number;

  @ApiProperty()
  @IsNumber()
  viewId: number;

  @ApiProperty({ type: [Object] })
  @IsArray()
  designElements: (TextElementDto | ImageElementDto)[];

  @ApiPropertyOptional({ type: [SizeSelectionDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SizeSelectionDto)
  sizeSelections?: SizeSelectionDto[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  previewImageUrl?: string;
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
