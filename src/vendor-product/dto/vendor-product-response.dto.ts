import { ApiProperty } from '@nestjs/swagger';

// ✅ NOUVEAUX DTOs POUR LES TRANSFORMATIONS ET POSITIONNEMENTS
export class DesignTransformDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/printalma/image/upload/v123/designs-originals/design_123.png' })
  designUrl: string;

  @ApiProperty({ 
    example: {
      scale: 1.2,
      rotation: 15,
      position: { x: 100, y: 50 },
      filters: { brightness: 110, contrast: 105 }
    }
  })
  transforms: any;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  lastModified: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

export class DesignPositionDto {
  @ApiProperty({ example: 12 })
  designId: number;

  @ApiProperty({ 
    example: {
      x: 150,
      y: 100,
      scale: 0.8,
      rotation: 0,
      constraints: { maxWidth: 300, maxHeight: 200 }
    }
  })
  position: any;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class DesignDetailDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'Design Flamme Rouge' })
  name: string;

  @ApiProperty({ example: 'Design abstrait avec motif flamme' })
  description: string;

  @ApiProperty({ example: 'ABSTRACT' })
  category: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/printalma/image/upload/v123/designs-originals/design_123.png' })
  imageUrl: string;

  @ApiProperty({ example: 'designs-originals/design_123' })
  cloudinaryPublicId: string;

  @ApiProperty({ example: ['flamme', 'rouge', 'abstrait'] })
  tags: string[];

  @ApiProperty({ example: true })
  isValidated: boolean;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  validatedAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

export class VendorProductImageDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'color' })
  type: 'color' | 'default';

  @ApiProperty({ example: 'Rouge', required: false })
  colorName?: string;

  @ApiProperty({ example: 12, required: false })
  colorId?: number;

  @ApiProperty({ example: '#ff0000', required: false })
  colorCode?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/example/image/upload/v1/vendor-products/product_123_12_rouge.webp' })
  imageUrl: string;

  @ApiProperty({ example: '123_12' })
  imageKey: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  uploadedAt: string;

  @ApiProperty({ example: 245760, required: false })
  fileSize?: number;
}

export class VendorProductSizeDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  sizeId: number;

  @ApiProperty({ example: 'S' })
  sizeName: string;
}

export class VendorProductColorDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 12 })
  colorId: number;

  @ApiProperty({ example: 'Rouge' })
  colorName: string;

  @ApiProperty({ example: '#ff0000' })
  colorCode: string;
}

export class BaseProductInfoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'T-shirt Basic' })
  name: string;

  @ApiProperty({ example: 'T-shirts' })
  category: string;

  @ApiProperty({ example: 'PUBLISHED' })
  status: string;
}

export class VendorInfoDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: 'DESIGNER', required: false })
  vendeurType?: string;

  @ApiProperty({ example: '+33 6 12 34 56 78', required: false })
  phone?: string;

  @ApiProperty({ example: 'France', required: false })
  country?: string;

  @ApiProperty({ example: '45 Av. des Champs-Élysées, 75008 Paris', required: false })
  address?: string;

  @ApiProperty({ example: 'Studio Marie Design', required: false })
  shop_name?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../profile-photos/vendor_45.png', required: false })
  profile_photo_url?: string;
}

export class VendorProductDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  vendorId: number;

  @ApiProperty({ example: 123 })
  baseProductId: number;

  @ApiProperty({ example: 'T-shirt Rouge Flamme Design' })
  vendorName: string;

  @ApiProperty({ example: 'Magnifique t-shirt avec design flamme personnalisé' })
  vendorDescription: string;

  @ApiProperty({ example: 15000 })
  price: number;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiProperty({ example: 12000 })
  basePriceAdmin: number;

  @ApiProperty({ example: 'PUBLISHED' })
  status: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/example/design.webp' })
  designUrl: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/example/mockup.webp', required: false })
  mockupUrl?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  @ApiProperty({ type: BaseProductInfoDto })
  baseProduct: BaseProductInfoDto;

  @ApiProperty({ type: VendorInfoDto })
  vendor: VendorInfoDto;

  @ApiProperty({ type: [VendorProductImageDto] })
  images: VendorProductImageDto[];

  @ApiProperty({ type: [VendorProductSizeDto] })
  sizes: VendorProductSizeDto[];

  @ApiProperty({ type: [VendorProductColorDto] })
  colors: VendorProductColorDto[];

  // ✅ NOUVEAUX CHAMPS POUR LES TRANSFORMATIONS ET POSITIONNEMENTS
  @ApiProperty({ 
    type: DesignDetailDto,
    required: false,
    description: 'Informations complètes sur le design utilisé'
  })
  design?: DesignDetailDto;

  @ApiProperty({ 
    type: [DesignTransformDto],
    description: 'Transformations appliquées au design'
  })
  designTransforms: DesignTransformDto[];

  @ApiProperty({ 
    type: [DesignPositionDto],
    description: 'Positionnements du design sur le produit'
  })
  designPositions: DesignPositionDto[];

  @ApiProperty({ 
    example: 12,
    required: false,
    description: 'ID du design utilisé'
  })
  designId?: number;

  // Métadonnées calculées
  @ApiProperty({ example: 4 })
  imageCount: number;

  @ApiProperty({ example: 3 })
  sizeCount: number;

  @ApiProperty({ example: 3 })
  colorCount: number;
}

export class VendorProductsListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [VendorProductDto] })
  products: VendorProductDto[];

  @ApiProperty({ 
    example: {
      total: 25,
      limit: 20,
      offset: 0,
      hasNext: true
    }
  })
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
}

export class VendorProductImagesResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [VendorProductImageDto] })
  images: VendorProductImageDto[];

  @ApiProperty({ 
    example: {
      totalImages: 4,
      colorImages: 3,
      defaultImages: 1
    }
  })
  summary: {
    totalImages: number;
    colorImages: number;
    defaultImages: number;
  };
}

export class VendorStatsDto {
  // Statistiques produits
  @ApiProperty({ example: 15 })
  totalProducts: number;

  @ApiProperty({ example: 12 })
  publishedProducts: number;

  @ApiProperty({ example: 3 })
  draftProducts: number;

  @ApiProperty({ example: 0 })
  pendingProducts: number;

  @ApiProperty({ example: 84000 })
  totalValue: number;

  @ApiProperty({ example: 7000 })
  averagePrice: number;

  // Statistiques designs
  @ApiProperty({ example: 8 })
  totalDesigns: number;

  @ApiProperty({ example: 5 })
  publishedDesigns: number;

  @ApiProperty({ example: 2 })
  draftDesigns: number;

  @ApiProperty({ example: 1 })
  pendingDesigns: number;

  @ApiProperty({ example: 6 })
  validatedDesigns: number;

  // 💰 NOUVELLES DONNÉES FINANCIÈRES
  @ApiProperty({ example: 2500000, description: 'Chiffre d\'affaires annuel en FCFA' })
  yearlyRevenue: number;

  @ApiProperty({ example: 180000, description: 'Chiffre d\'affaires mensuel en FCFA' })
  monthlyRevenue: number;

  @ApiProperty({ example: 450000, description: 'Solde disponible pour retrait en FCFA' })
  availableBalance: number;

  @ApiProperty({ example: 75000, description: 'Montant en attente (demandes d\'appels de fonds)' })
  pendingAmount: number;

  @ApiProperty({ example: 3250000, description: 'Total des gains depuis l\'inscription' })
  totalEarnings: number;

  // 📊 STATISTIQUES D'ACTIVITÉ
  @ApiProperty({ example: 1250, description: 'Nombre total de vues de la boutique' })
  shopViews: number;

  @ApiProperty({ example: 45, description: 'Nombre de commandes traitées' })
  totalOrders: number;

  @ApiProperty({ example: 8.5, description: 'Taux de commission moyen (%)' })
  averageCommissionRate: number;

  // 📅 DATES IMPORTANTES
  @ApiProperty({ example: '2024-05-12T09:31:00.000Z', required: false })
  memberSince?: string;

  @ApiProperty({ example: '2025-09-18T14:05:00.000Z', required: false })
  lastLoginAt?: string;

  @ApiProperty({ example: '2024-05-12 09:31', required: false })
  memberSinceFormatted?: string;

  @ApiProperty({ example: '2025-09-18 14:05', required: false })
  lastLoginAtFormatted?: string;

  @ApiProperty({ example: 'v2_preserved_admin' })
  architecture: string;
}

export class VendorStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: VendorStatsDto })
  data: VendorStatsDto;
}

/**
 * ✅ NOUVEAU: DTO pour les détails complets d'un produit vendeur
 */
export class VendorProductDetailImageDto {
  @ApiProperty({ example: 789 })
  id: number;

  @ApiProperty({ example: 123 })
  vendorProductId: number;

  @ApiProperty({ example: 1, required: false })
  colorId?: number;

  @ApiProperty({ example: 'Blanc', required: false })
  colorName?: string;

  @ApiProperty({ example: '#FFFFFF', required: false })
  colorCode?: string;

  @ApiProperty({ example: 'color' })
  imageType: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp' })
  cloudinaryUrl: string;

  @ApiProperty({ example: 'vendor-products/blanc_123' })
  cloudinaryPublicId: string;

  @ApiProperty({ example: 'Blanc' })
  originalImageKey: string;

  @ApiProperty({ example: 1200, required: false })
  width?: number;

  @ApiProperty({ example: 1200, required: false })
  height?: number;

  @ApiProperty({ example: 245760, required: false })
  fileSize?: number;

  @ApiProperty({ example: 'webp' })
  format: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  uploadedAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class VendorProductDetailBaseProductDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'T-shirt Basique' })
  name: string;

  @ApiProperty({ example: 15000 })
  price: number;

  @ApiProperty({ example: 'PUBLISHED' })
  status: string;

  @ApiProperty({ example: 'T-shirt de base pour personnalisation' })
  description: string;

  @ApiProperty({ 
    example: [{ id: 1, name: 'T-shirts' }]
  })
  categories: Array<{ id: number; name: string }>;
}

export class VendorProductDetailVendorDto {
  @ApiProperty({ example: 456 })
  id: number;

  @ApiProperty({ example: 'Jean' })
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  lastName: string;

  @ApiProperty({ example: 'jean.dupont@example.com' })
  email: string;

  @ApiProperty({ example: 'INDIVIDUAL', required: false })
  vendeurType?: string;

  @ApiProperty({ example: '+33 6 12 34 56 78', required: false })
  phone?: string;

  @ApiProperty({ example: 'France', required: false })
  country?: string;

  @ApiProperty({ example: '45 Av. des Champs-Élysées, 75008 Paris', required: false })
  address?: string;

  @ApiProperty({ example: 'Studio Marie Design', required: false })
  shop_name?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../profile-photos/vendor_45.png', required: false })
  profile_photo_url?: string;

  @ApiProperty({ example: 'Jean Dupont' })
  fullName: string;

  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;
}

export class VendorProductDetailDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 456 })
  vendorId: number;

  @ApiProperty({ example: 1 })
  baseProductId: number;

  @ApiProperty({ example: 25000 })
  price: number;

  @ApiProperty({ example: 'PUBLISHED' })
  status: string;

  @ApiProperty({ example: 'T-shirt Design Flamme' })
  vendorName: string;

  @ApiProperty({ example: 'Magnifique t-shirt personnalisé avec design flamme' })
  vendorDescription: string;

  @ApiProperty({ example: 50 })
  vendorStock: number;

  @ApiProperty({ example: 15000 })
  basePriceAdmin: number;

  @ApiProperty({ example: 'https://res.cloudinary.com/printalma/image/upload/v123/designs-originals/design_123.png' })
  designUrl: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/mockup_123.webp', required: false })
  mockupUrl?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/printalma/image/upload/v123/designs-originals/design_123.png', required: false })
  originalDesignUrl?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;

  // Relations
  @ApiProperty({ type: VendorProductDetailBaseProductDto })
  baseProduct: VendorProductDetailBaseProductDto;

  @ApiProperty({ type: VendorProductDetailVendorDto })
  vendor: VendorProductDetailVendorDto;

  // Tailles sélectionnées (JSON décodé)
  @ApiProperty({ 
    example: [
      { id: 1, sizeName: 'S' },
      { id: 2, sizeName: 'M' },
      { id: 3, sizeName: 'L' }
    ]
  })
  selectedSizes: Array<{ id: number; sizeName: string }>;

  // Couleurs sélectionnées (JSON décodé)
  @ApiProperty({ 
    example: [
      { id: 1, name: 'Blanc', colorCode: '#FFFFFF' },
      { id: 2, name: 'Noir', colorCode: '#000000' }
    ]
  })
  selectedColors: Array<{ id: number; name: string; colorCode: string }>;

  // Images détaillées
  @ApiProperty({ 
    type: 'object',
    example: {
      total: 2,
      colorImages: [
        {
          id: 789,
          vendorProductId: 123,
          colorId: 1,
          colorName: 'Blanc',
          colorCode: '#FFFFFF',
          imageType: 'color',
          cloudinaryUrl: 'https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp',
          cloudinaryPublicId: 'vendor-products/blanc_123',
          originalImageKey: 'Blanc',
          width: 1500,
          height: 1500,
          fileSize: 245760,
          format: 'webp',
          uploadedAt: '2024-01-15T10:30:00.000Z'
        }
      ],
      defaultImages: [],
      primaryImageUrl: 'https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp',
      imageUrls: [
        'https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/blanc_123.webp',
        'https://res.cloudinary.com/printalma/image/upload/v123/vendor-products/noir_123.webp'
      ]
    }
  })
  images: {
    total: number;
    colorImages: VendorProductDetailImageDto[];
    defaultImages: VendorProductDetailImageDto[];
    primaryImageUrl: string | null;
    imageUrls: string[];
  };

  // Métadonnées calculées
  @ApiProperty({ 
    example: {
      profitMargin: 10000,
      profitPercentage: 66.67,
      totalValue: 1250000,
      averageImageSize: 245760,
      designQuality: 'HIGH',
      lastModified: '2024-01-15T10:30:00.000Z'
    }
  })
  metadata: {
    profitMargin: number;
    profitPercentage: number;
    totalValue: number;
    averageImageSize: number;
    designQuality: string;
    lastModified: string;
  };
}

export class VendorProductDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: VendorProductDetailDto })
  data: VendorProductDetailDto;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  retrievedAt: string;
} 