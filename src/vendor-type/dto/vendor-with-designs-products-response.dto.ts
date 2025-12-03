import { ApiProperty } from '@nestjs/swagger';

export class VendorDesignResponseDto {
  @ApiProperty({ description: 'ID du design' })
  id: number;

  @ApiProperty({ description: 'Nom du design' })
  name: string;

  @ApiProperty({ description: 'Description du design', required: false })
  description?: string;

  @ApiProperty({ description: 'Prix du design' })
  price: number;

  @ApiProperty({ description: 'URL de l\'image du design' })
  imageUrl: string;

  @ApiProperty({ description: 'URL de la miniature', required: false })
  thumbnailUrl?: string;

  @ApiProperty({ description: 'Dimensions du design' })
  dimensions: any;

  @ApiProperty({ description: 'Format du design' })
  format: string;

  @ApiProperty({ description: 'Tags du design', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Design validé' })
  isValidated: boolean;

  @ApiProperty({ description: 'Design publié' })
  isPublished: boolean;

  @ApiProperty({ description: 'Nombre de vues' })
  views: number;

  @ApiProperty({ description: 'Nombre de likes' })
  likes: number;

  @ApiProperty({ description: 'Gains du design' })
  earnings: number;

  @ApiProperty({ description: 'Nombre d\'utilisations' })
  usageCount: number;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de publication', required: false })
  publishedAt?: Date;

  @ApiProperty({ description: 'Catégorie du design', required: false })
  category?: {
    id: number;
    name: string;
    slug: string;
  };

  @ApiProperty({ description: 'Délimitations du design', required: false })
  delimitations?: any;

  @ApiProperty({ description: 'Positionnement du design', required: false })
  productPositions?: any[];
}

export class VendorProductResponseDto {
  @ApiProperty({ description: 'ID du produit vendeur' })
  id: number;

  @ApiProperty({ description: 'Nom du produit' })
  name: string;

  @ApiProperty({ description: 'Description du produit', required: false })
  description?: string;

  @ApiProperty({ description: 'Prix du produit' })
  price: number;

  @ApiProperty({ description: 'Stock disponible' })
  stock: number;

  @ApiProperty({ description: 'Statut du produit' })
  status: string;

  @ApiProperty({ description: 'Produit validé' })
  isValidated: boolean;

  @ApiProperty({ description: 'Nombre de ventes' })
  salesCount: number;

  @ApiProperty({ description: 'Revenus totaux' })
  totalRevenue: number;

  @ApiProperty({ description: 'Note moyenne', required: false })
  averageRating?: number;

  @ApiProperty({ description: 'Meilleure vente' })
  isBestSeller: boolean;

  @ApiProperty({ description: 'Classement meilleure vente', required: false })
  bestSellerRank?: number;

  @ApiProperty({ description: 'Catégorie meilleure vente', required: false })
  bestSellerCategory?: string;

  @ApiProperty({ description: 'Nombre de vues' })
  viewsCount: number;

  @ApiProperty({ description: 'Largeur du design', required: false })
  designWidth?: number;

  @ApiProperty({ description: 'Hauteur du design', required: false })
  designHeight?: number;

  @ApiProperty({ description: 'Format du design', required: false })
  designFormat?: string;

  @ApiProperty({ description: 'URL du design sur Cloudinary', required: false })
  designCloudinaryUrl?: string;

  @ApiProperty({ description: 'Positionnement du design', required: false })
  designPositioning?: string;

  @ApiProperty({ description: 'Échelle du design', required: false })
  designScale?: number;

  @ApiProperty({ description: 'Tailles disponibles', type: Object })
  sizes: any;

  @ApiProperty({ description: 'Couleurs disponibles', type: Object })
  colors: any;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de validation', required: false })
  validatedAt?: Date;

  @ApiProperty({ description: 'Produit de base associé' })
  baseProduct?: {
    id: number;
    name: string;
    description?: string;
    category?: {
      id: number;
      name: string;
    };
    subCategory?: {
      id: number;
      name: string;
    };
    variation?: {
      id: number;
      name: string;
    };
  };

  @ApiProperty({ description: 'Design associé', required: false })
  design?: VendorDesignResponseDto;
}

export class VendorWithDesignsAndProductsResponseDto {
  @ApiProperty({ description: 'ID du vendeur' })
  id: number;

  @ApiProperty({ description: 'Nom du vendeur' })
  firstName: string;

  @ApiProperty({ description: 'Prénom du vendeur' })
  lastName: string;

  @ApiProperty({ description: 'Email du vendeur' })
  email: string;

  @ApiProperty({ description: 'Nom de la boutique', required: false })
  shopName?: string;

  @ApiProperty({ description: 'Photo de profil', required: false })
  photoProfil?: string;

  @ApiProperty({ description: 'Avatar', required: false })
  avatar?: string;

  @ApiProperty({ description: 'Adresse', required: false })
  address?: string;

  @ApiProperty({ description: 'Pays', required: false })
  country?: string;

  @ApiProperty({ description: 'Téléphone', required: false })
  phone?: string;

  @ApiProperty({ description: 'URL de la photo de profil', required: false })
  profilePhotoUrl?: string;

  @ApiProperty({ description: 'Statut du vendeur' })
  status: boolean;

  @ApiProperty({ description: 'Type de vendeur', required: false })
  vendorType?: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière connexion', required: false })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Designs du vendeur', type: [VendorDesignResponseDto] })
  designs: VendorDesignResponseDto[];

  @ApiProperty({ description: 'Produits du vendeur', type: [VendorProductResponseDto] })
  products: VendorProductResponseDto[];

  @ApiProperty({ description: 'Nombre total de designs' })
  totalDesigns: number;

  @ApiProperty({ description: 'Nombre total de produits' })
  totalProducts: number;

  @ApiProperty({ description: 'Nombre de designs publiés' })
  publishedDesigns: number;

  @ApiProperty({ description: 'Nombre de produits validés' })
  validatedProducts: number;

  @ApiProperty({ description: 'Gains totaux des designs' })
  totalDesignEarnings: number;

  @ApiProperty({ description: 'Revenus totaux des produits' })
  totalProductRevenue: number;

  @ApiProperty({ description: 'Nombre total de vues sur les designs' })
  totalDesignViews: number;

  @ApiProperty({ description: 'Nombre total de vues sur les produits' })
  totalProductViews: number;
}

export class VendorsListResponseDto {
  @ApiProperty({ description: 'Liste des vendeurs avec leurs designs et produits', type: [VendorWithDesignsAndProductsResponseDto] })
  vendors: VendorWithDesignsAndProductsResponseDto[];

  @ApiProperty({ description: 'Nombre total de vendeurs' })
  total: number;

  @ApiProperty({ description: 'Page actuelle' })
  page: number;

  @ApiProperty({ description: 'Nombre de vendeurs par page' })
  limit: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;
}