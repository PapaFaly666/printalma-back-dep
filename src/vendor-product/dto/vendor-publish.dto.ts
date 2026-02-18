import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsObject, ValidateNested, IsOptional, Min, ArrayNotEmpty, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

// -----------------------------------------------------------------------------
// 💰 SIZE PRICING DTOs
// -----------------------------------------------------------------------------

export class SizePricingDto {
  @ApiProperty({ example: 'S', description: 'Nom de la taille' })
  @IsString()
  size: string;

  @ApiProperty({ example: 8000, description: 'Prix de revient en FCFA' })
  @IsNumber()
  costPrice: number;

  @ApiProperty({ example: 12000, description: 'Prix de vente suggéré en FCFA' })
  @IsNumber()
  suggestedPrice: number;

  @ApiProperty({ example: 15000, required: false, description: 'Prix de vente défini par le vendeur (optionnel)' })
  @IsOptional()
  @IsNumber()
  salePrice?: number;
}

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

  @ApiProperty({ example: 'T-shirt premium avec design dragon exclusif', required: false, description: 'Description personnalisée du vendeur. Si non fournie, la description du produit admin sera utilisée.' })
  @IsOptional()
  @IsString()
  vendorDescription?: string;

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

  @ApiProperty({
    example: 30,
    description: 'ID de la couleur par défaut à afficher en premier aux clients. Doit faire partie des selectedColors.',
    required: false
  })
  @IsOptional()
  @IsNumber()
  defaultColorId?: number;

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
    example: {
      x: 60,
      y: -30,
      scale: 0.8,
      rotation: 0,
      positionUnit: 'PIXEL',
      delimitationWidth: 600,
      delimitationHeight: 600
    },
    required: false,
    description: '🎯 Position du design avec logique unifiée frontend ↔ backend. ' +
      'delimitationWidth/Height sont OBLIGATOIRES pour la cohérence.'
  })
  @IsOptional()
  @IsObject()
  designPosition?: {
    /** Offset X depuis le centre de la délimitation (en pixels) */
    x: number;
    /** Offset Y depuis le centre de la délimitation (en pixels) */
    y: number;
    /** Échelle appliquée à la délimitation (0.8 = 80%) */
    scale: number;
    /** Rotation en degrés */
    rotation: number;
    /** Unité de position (toujours 'PIXEL' pour la logique unifiée) */
    positionUnit?: 'PIXEL' | 'PERCENTAGE';
    /** ✅ OBLIGATOIRE: Largeur de la délimitation en pixels */
    delimitationWidth?: number;
    /** ✅ OBLIGATOIRE: Hauteur de la délimitation en pixels */
    delimitationHeight?: number;

    // ❌ OBSOLÈTE: Ces champs ne sont plus utilisés
    // constraints?: any;
    // design_width?: number;
    // design_height?: number;
    // designWidth?: number;
    // designHeight?: number;
    // width?: number;
    // height?: number;
  };

  @ApiProperty({
    example: false,
    required: false,
    description: 'Bypass validation pour mode développement/test'
  })
  @IsOptional()
  @IsBoolean()
  bypassValidation?: boolean;

  // -----------------------------------------------------------------------------
  // 💰 SIZE PRICING - Prix par taille
  // -----------------------------------------------------------------------------

  @ApiProperty({
    example: false,
    required: false,
    description: 'Utiliser des prix globaux pour toutes les tailles'
  })
  @IsOptional()
  @IsBoolean()
  useGlobalPricing?: boolean;

  @ApiProperty({
    example: 10000,
    required: false,
    description: 'Prix de revient global (si useGlobalPricing = true)'
  })
  @IsOptional()
  @IsNumber()
  globalCostPrice?: number;

  @ApiProperty({
    example: 15000,
    required: false,
    description: 'Prix de vente suggéré global (si useGlobalPricing = true)'
  })
  @IsOptional()
  @IsNumber()
  globalSuggestedPrice?: number;

  @ApiProperty({
    type: [SizePricingDto],
    required: false,
    description: 'Prix par taille (si useGlobalPricing = false)'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SizePricingDto)
  sizePricing?: SizePricingDto[];
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

  @ApiProperty({ example: 'https://res.cloudinary.com/.../final_123_1234567890.png', required: false })
  @IsOptional()
  @IsString()
  finalImageUrl?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  isDesignReused?: boolean;

  // ⏱️ TIMING: Informations de timing pour la génération des images finales
  @ApiProperty({
    required: false,
    description: 'Informations de timing pour la génération des images finales (pour le frontend)',
    example: {
      totalGenerationTime: 12500,
      totalColors: 4,
      colorsProcessed: 4,
      colorsRemaining: 0,
      averageTimePerColor: 3125,
      estimatedRemainingTime: 0,
      colorTimings: [
        { colorName: 'Blanc', duration: 3000, success: true },
        { colorName: 'Blue', duration: 3200, success: true },
        { colorName: 'Rouge', duration: 3100, success: true },
        { colorName: 'Noir', duration: 3200, success: true }
      ],
      estimatedTimePerImage: 3125,
      completionPercentage: 100,
      isAsync: true,
      statusEndpoint: '/vendor/products/:id/images-status',
      userMessage: 'Génération des images en cours...'
    }
  })
  @IsOptional()
  timing?: {
    /** Temps total de génération en millisecondes */
    totalGenerationTime?: number;
    /** Nombre total de couleurs à traiter */
    totalColors?: number;
    /** Nombre de couleurs traitées avec succès */
    colorsProcessed?: number;
    /** Nombre de couleurs restantes */
    colorsRemaining?: number;
    /** Temps moyen par couleur en millisecondes */
    averageTimePerColor?: number;
    /** Temps estimé restant en millisecondes */
    estimatedRemainingTime?: number;
    /** Détails de timing pour chaque couleur */
    colorTimings?: Array<{
      colorName: string;
      duration: number;
      success: boolean;
    }>;
    /** Temps estimé par image (basé sur la moyenne ou défaut 3s) - pour guide frontend */
    estimatedTimePerImage?: number;
    /** Pourcentage de complétion */
    completionPercentage?: number;
    /** Indique si la génération est asynchrone (non-bloquante) */
    isAsync?: boolean;
    /** Endpoint pour vérifier le statut de génération (si isAsync = true) */
    statusEndpoint?: string;
    /** Message utilisateur pour afficher pendant la génération */
    userMessage?: string;
    /** Temps total estimé pour la génération (ms) */
    estimatedTotalTime?: number;
    /** Indique si on peut vérifier le statut */
    canCheckStatus?: boolean;
  };

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