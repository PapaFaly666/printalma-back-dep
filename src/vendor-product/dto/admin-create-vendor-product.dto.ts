import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsArray, ValidateNested } from 'class-validator';
import { VendorPublishDto, VendorPublishResponseDto, CreateDesignDto } from './vendor-publish.dto';
import { Type } from 'class-transformer';

/**
 * DTO pour créer un nouveau design au nom d'un vendeur
 */
export class AdminCreateDesignForVendorDto {
  @ApiProperty({ 
    example: 'Design créé par Admin',
    description: 'Nom du design' 
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'Design créé par l\'administrateur',
    required: false,
    description: 'Description du design' 
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    example: 'LOGO',
    enum: ['LOGO', 'PATTERN', 'ILLUSTRATION', 'TYPOGRAPHY', 'ABSTRACT'],
    description: 'Catégorie du design' 
  })
  @IsString()
  category: string;

  @ApiProperty({ 
    example: 'data:image/png;base64,iVBORw0K...',
    description: 'Image en base64' 
  })
  @IsString()
  imageBase64: string;

  @ApiProperty({ 
    type: [String],
    example: ['admin', 'créé'],
    required: false,
    description: 'Tags du design' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

/**
 * DTO pour la création de produit vendeur par l'admin
 * Étend VendorPublishDto avec l'ajout du vendorId et gestion des designs
 */
export class AdminCreateVendorProductDto extends VendorPublishDto {
  @ApiProperty({ 
    example: 123, 
    description: 'ID du vendeur pour qui créer le produit' 
  })
  @IsNumber()
  vendorId: number;
  
  @ApiProperty({ 
    example: 42,
    required: false,
    description: 'ID du design existant à utiliser (optionnel si newDesign fourni)' 
  })
  @IsOptional()
  @IsNumber()
  designId?: number;

  @ApiProperty({ 
    type: AdminCreateDesignForVendorDto,
    required: false,
    description: 'Nouveau design à créer pour le vendeur (optionnel si designId fourni)' 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminCreateDesignForVendorDto)
  newDesign?: AdminCreateDesignForVendorDto;
  
  @ApiProperty({ 
    example: false, 
    required: false,
    description: 'Bypass toute validation admin (utile pour les tests)' 
  })
  @IsOptional()
  bypassAdminValidation?: boolean;
}

/**
 * Réponse pour la création de produit vendeur par l'admin
 */
export class AdminCreateVendorProductResponseDto extends VendorPublishResponseDto {
  @ApiProperty({ 
    example: 123, 
    description: 'ID du vendeur pour qui le produit a été créé' 
  })
  vendorId: number;

  @ApiProperty({ 
    example: 'John Doe', 
    description: 'Nom du vendeur' 
  })
  vendorName: string;

  @ApiProperty({ 
    example: 'admin_created', 
    description: 'Source de création du produit' 
  })
  createdBy: string;

  @ApiProperty({ 
    example: true,
    required: false,
    description: 'Indique si un nouveau design a été créé' 
  })
  @IsOptional()
  newDesignCreated?: boolean;

  @ApiProperty({ 
    example: 'Design créé par Admin',
    required: false,
    description: 'Nom du design créé (si applicable)' 
  })
  @IsOptional()
  newDesignName?: string;
}

/**
 * DTO pour lister les vendeurs disponibles
 */
export class VendorOptionDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiProperty({ example: 'Boutique John', required: false })
  shop_name?: string;

  @ApiProperty({ example: 'DESIGNER', required: false })
  vendeur_type?: string;

  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 15 })
  totalProducts: number;

  @ApiProperty({ example: 8 })
  publishedProducts: number;

  @ApiProperty({ example: 12 })
  totalDesigns: number;
}

/**
 * Réponse pour la liste des vendeurs
 */
export class VendorListResponseDto {
  @ApiProperty({ type: [VendorOptionDto] })
  vendors: VendorOptionDto[];

  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ 
    example: { 
      active: 20, 
      inactive: 5, 
      withProducts: 15, 
      withoutProducts: 10 
    } 
  })
  stats: {
    active: number;
    inactive: number;
    withProducts: number;
    withoutProducts: number;
  };
}

/**
 * DTO pour un design vendeur
 */
export class VendorDesignDto {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 'Mon Design Génial' })
  name: string;

  @ApiProperty({ example: 'Description de mon design', required: false })
  description?: string;

  @ApiProperty({ example: 'LOGO' })
  category: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  imageUrl: string;

  @ApiProperty({ example: 'design_123' })
  cloudinaryPublicId: string;

  @ApiProperty({ example: true })
  isValidated: boolean;

  @ApiProperty({ example: '2023-12-01T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2023-12-07T14:00:00Z', required: false })
  validatedAt?: string;

  @ApiProperty({ example: ['créatif', 'moderne'], required: false })
  tags?: string[];
}

/**
 * Réponse pour la liste des designs d'un vendeur
 */
export class VendorDesignsResponseDto {
  @ApiProperty({ type: [VendorDesignDto] })
  designs: VendorDesignDto[];

  @ApiProperty({ example: 12 })
  total: number;

  @ApiProperty({ 
    example: { 
      validated: 8, 
      pending: 3, 
      rejected: 1 
    } 
  })
  stats: {
    validated: number;
    pending: number;
    rejected: number;
  };
} 