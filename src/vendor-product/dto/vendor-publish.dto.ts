import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsObject, ValidateNested, IsOptional, Min, ArrayNotEmpty, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// -----------------------------------------------------------------------------
// 📦  ADMIN PRODUCT STRUCTURE DTOs
// -----------------------------------------------------------------------------

export class AdminImageDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../tshirt-front-red.jpg' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'FRONT' })
  @IsString()
  viewType: string;

  @ApiProperty({ type: 'array', example: [{ x: 100, y: 80, width: 200, height: 150, coordinateType: 'ABSOLUTE' }] })
  @IsArray()
  delimitations: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    coordinateType: 'ABSOLUTE' | 'PERCENTAGE';
  }>;
}

export class AdminColorVariationDto {
  @ApiProperty({ example: 12 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'Rouge' })
  @IsString()
  name: string;

  @ApiProperty({ example: '#ff0000' })
  @IsString()
  colorCode: string;

  @ApiProperty({ type: [AdminImageDto] })
  @ValidateNested({ each: true })
  @Type(() => AdminImageDto)
  @IsArray()
  images: AdminImageDto[];
}

export class AdminProductDto {
  @ApiProperty({ example: 4 })
  @IsNumber()
  id: number;

  @ApiProperty({ example: 'T-shirt Basique' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'T-shirt en coton 100% de qualité premium' })
  @IsString()
  description: string;

  @ApiProperty({ example: 19000 })
  @IsNumber()
  price: number;

  @ApiProperty({ type: 'object', example: { colorVariations: [] } })
  @IsObject()
  images: {
    colorVariations: AdminColorVariationDto[];
  };

  @ApiProperty({ type: 'array', example: [{ id: 1, sizeName: 'S' }] })
  @IsArray()
  sizes: Array<{ id: number; sizeName: string }>;
}

// -----------------------------------------------------------------------------
// 🎨  DESIGN APPLICATION DTO
// -----------------------------------------------------------------------------

export class DesignApplicationDto {
  @ApiProperty({ example: 'CENTER' })
  @IsString()
  positioning: 'CENTER';

  @ApiProperty({ example: 0.6 })
  @IsNumber()
  scale: number;
}

export class ProductStructureDto {
  @ApiProperty({ type: AdminProductDto })
  @ValidateNested()
  @Type(() => AdminProductDto)
  adminProduct: AdminProductDto;

  @ApiProperty({ type: DesignApplicationDto })
  @ValidateNested()
  @Type(() => DesignApplicationDto)
  designApplication: DesignApplicationDto;
}

// -----------------------------------------------------------------------------
// 🛒  SELECTIONS DTOs
// -----------------------------------------------------------------------------

export class SelectedColorDto {
  @ApiProperty({ example: 30 })
  @IsNumber()
  id: number;
  @ApiProperty({ example: 'Noir' })
  @IsString()
  name: string;
  @ApiProperty({ example: '#000000' })
  @IsString()
  colorCode: string;
}

export class SelectedSizeDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  id: number;
  @ApiProperty({ example: 'S' })
  @IsString()
  sizeName: string;
}

// -----------------------------------------------------------------------------
// 🚀  MAIN DTOs
// -----------------------------------------------------------------------------

export class VendorPublishDto {
  @ApiProperty({ example: 4 })
  @IsNumber()
  baseProductId: number;

  @ApiProperty({ type: ProductStructureDto })
  @ValidateNested()
  @Type(() => ProductStructureDto)
  productStructure: ProductStructureDto;

  @ApiProperty({ example: 25000 })
  @IsNumber()
  @Min(0)
  vendorPrice: number;

  @ApiProperty({ example: 'T-shirt Dragon Rouge Premium' })
  @IsString()
  vendorName: string;

  @ApiProperty({ example: 'T-shirt premium avec design dragon exclusif' })
  @IsString()
  vendorDescription: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  vendorStock: number;

  @ApiProperty({ type: [SelectedColorDto] })
  @ArrayNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedColorDto)
  selectedColors: SelectedColorDto[];

  @ApiProperty({ type: [SelectedSizeDto] })
  @ArrayNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedSizeDto)
  selectedSizes: SelectedSizeDto[];

  @ApiProperty({ example: 42, description: 'ID du design à utiliser pour ce produit', required: false })
  @IsOptional()
  @IsNumber()
  designId?: number;

  @ApiProperty({ example: 'DRAFT', required: false, enum: ['PENDING', 'DRAFT'] })
  @IsOptional()
  @IsString()
  forcedStatus?: 'PENDING' | 'DRAFT';

  @ApiProperty({ example: 'AUTO_PUBLISH', required: false, enum: ['AUTO_PUBLISH', 'TO_DRAFT'] })
  @IsOptional()
  @IsString()
  postValidationAction?: 'AUTO_PUBLISH' | 'TO_DRAFT';

  @ApiProperty({ 
    example: { x: 0, y: 0, scale: 1, rotation: 0, design_width: 1200, design_height: 1200 }, 
    required: false,
    description: 'Position du design sur le produit (depuis localStorage) avec dimensions' 
  })
  @IsOptional()
  @IsObject()
  designPosition?: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
    constraints?: any;
    design_width?: number;
    design_height?: number;
    designWidth?: number;
    designHeight?: number;
    width?: number;
    height?: number;
  };

  @ApiProperty({ 
    example: false, 
    required: false,
    description: 'Bypass validation pour mode développement/test' 
  })
  @IsOptional()
  @IsBoolean()
  bypassValidation?: boolean;
}

export class VendorPublishResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 123 })
  productId: number;

  @ApiProperty({ example: 'Produit créé avec architecture admin + design Cloudinary' })
  message: string;

  @ApiProperty({ example: 'DRAFT', enum: ['PUBLISHED', 'DRAFT', 'PENDING', 'TRANSFORMATION'] })
  status: string;

  @ApiProperty({ example: false })
  needsValidation: boolean;

  @ApiProperty({ example: 1 })
  imagesProcessed: number;

  @ApiProperty({ example: 'admin_product_preserved' })
  structure: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../vendor_9_design.png', required: false })
  @IsOptional()
  @IsString()
  designUrl?: string;

  @ApiProperty({ example: 42, required: false })
  @IsOptional()
  designId?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isDesignReused?: boolean;

  // 🆕 PROPRIÉTÉS SPÉCIFIQUES AU MODE TRANSFORMATION
  @ApiProperty({ example: 15, required: false, description: 'ID de la transformation sauvegardée' })
  @IsOptional()
  transformationId?: number;

  @ApiProperty({ example: '25_42', required: false, description: 'ID composite de la position (vendorProductId_designId)' })
  @IsOptional()
  positionId?: string;
}

export class VendorProductValidationDto {
  @ApiProperty({ example: true })
  isValid: boolean;

  @ApiProperty({ example: [] })
  errors: string[];
}

// -----------------------------------------------------------------------------
// 🎨  CREATE DESIGN DTOs
// -----------------------------------------------------------------------------

export class CreateDesignDto {
  @ApiProperty({ example: 'Mon Super Design' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Description de mon design créatif', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'ILLUSTRATION', enum: ['LOGO', 'PATTERN', 'ILLUSTRATION', 'TYPOGRAPHY', 'ABSTRACT'] })
  @IsString()
  category: string;

  @ApiProperty({ example: 'data:image/png;base64,iVBORw0K...' })
  @IsString()
  imageBase64: string;

  @ApiProperty({ type: [String], example: ['créatif', 'moderne'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ example: 1200, required: false, description: 'Prix du design en FCFA' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

export class CreateDesignResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 42 })
  designId: number;

  @ApiProperty({ example: 'Design "Mon Super Design" créé avec succès' })
  message: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../design.jpg' })
  designUrl: string;
} 