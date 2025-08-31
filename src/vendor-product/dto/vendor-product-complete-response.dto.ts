import { ApiProperty } from '@nestjs/swagger';

export class VendorInfoDto {
  @ApiProperty({ description: 'ID du vendeur' })
  id: number;

  @ApiProperty({ description: 'Prénom du vendeur' })
  firstName: string;

  @ApiProperty({ description: 'Nom du vendeur' })
  lastName: string;

  @ApiProperty({ description: 'Email du vendeur' })
  email: string;

  @ApiProperty({ description: 'Nom de la boutique', required: false })
  shop_name?: string;

  @ApiProperty({ description: 'Téléphone du vendeur', required: false })
  phone?: string;

  @ApiProperty({ description: 'Pays du vendeur', required: false })
  country?: string;

  @ApiProperty({ description: 'Adresse du vendeur', required: false })
  address?: string;

  @ApiProperty({ description: 'URL de la photo de profil', required: false })
  profile_photo_url?: string;

  @ApiProperty({ description: 'Type de vendeur', required: false })
  vendeur_type?: string;

  @ApiProperty({ description: 'Statut actif du vendeur' })
  status: boolean;

  @ApiProperty({ description: 'Date de création' })
  created_at: Date;

  @ApiProperty({ description: 'Dernière connexion', required: false })
  last_login_at?: Date;
}

export class DelimitationDto {
  @ApiProperty({ description: 'ID de la délimitation' })
  id: number;

  @ApiProperty({ description: 'Position X (en pourcentage ou pixels)' })
  x: number;

  @ApiProperty({ description: 'Position Y (en pourcentage ou pixels)' })
  y: number;

  @ApiProperty({ description: 'Largeur (en pourcentage ou pixels)' })
  width: number;

  @ApiProperty({ description: 'Hauteur (en pourcentage ou pixels)' })
  height: number;

  @ApiProperty({ description: 'Rotation en degrés' })
  rotation: number;

  @ApiProperty({ description: 'Nom de la zone', required: false })
  name?: string;

  @ApiProperty({ description: 'Type de coordonnées (ABSOLUTE ou PERCENTAGE)' })
  coordinateType: string;
}

export class ProductImageDto {
  @ApiProperty({ description: 'ID de l\'image' })
  id: number;

  @ApiProperty({ description: 'Vue (Front, Back, etc.)' })
  view: string;

  @ApiProperty({ description: 'URL de l\'image' })
  url: string;

  @ApiProperty({ description: 'Public ID Cloudinary' })
  publicId: string;

  @ApiProperty({ description: 'Largeur naturelle', required: false })
  naturalWidth?: number;

  @ApiProperty({ description: 'Hauteur naturelle', required: false })
  naturalHeight?: number;

  @ApiProperty({ description: 'URL du design appliqué', required: false })
  designUrl?: string;

  @ApiProperty({ description: 'Délimitations de l\'image', type: [DelimitationDto] })
  delimitations: DelimitationDto[];
}

export class ColorVariationDto {
  @ApiProperty({ description: 'ID de la variation de couleur' })
  id: number;

  @ApiProperty({ description: 'Nom de la couleur' })
  name: string;

  @ApiProperty({ description: 'Code couleur (hex)' })
  colorCode: string;

  @ApiProperty({ description: 'Images de cette couleur', type: [ProductImageDto] })
  images: ProductImageDto[];
}

export class CategoryDto {
  @ApiProperty({ description: 'ID de la catégorie' })
  id: number;

  @ApiProperty({ description: 'Nom de la catégorie' })
  name: string;

  @ApiProperty({ description: 'Description de la catégorie', required: false })
  description?: string;
}

export class ProductSizeDto {
  @ApiProperty({ description: 'ID de la taille' })
  id: number;

  @ApiProperty({ description: 'Nom de la taille' })
  sizeName: string;
}

export class ValidatorDto {
  @ApiProperty({ description: 'ID du validateur' })
  id: number;

  @ApiProperty({ description: 'Prénom du validateur' })
  firstName: string;

  @ApiProperty({ description: 'Nom du validateur' })
  lastName: string;

  @ApiProperty({ description: 'Email du validateur' })
  email: string;

  @ApiProperty({ description: 'Rôle du validateur', required: false })
  role?: string;
}

export class BaseProductDto {
  @ApiProperty({ description: 'ID du produit de base' })
  id: number;

  @ApiProperty({ description: 'Nom du produit de base' })
  name: string;

  @ApiProperty({ description: 'Description du produit de base' })
  description: string;

  @ApiProperty({ description: 'Prix du produit de base' })
  price: number;

  @ApiProperty({ description: 'Stock du produit de base' })
  stock: number;

  @ApiProperty({ description: 'Statut du produit de base' })
  status: string;

  @ApiProperty({ description: 'Catégories du produit', type: [CategoryDto] })
  categories: CategoryDto[];

  @ApiProperty({ description: 'Tailles disponibles', type: [ProductSizeDto] })
  sizes: ProductSizeDto[];

  @ApiProperty({ description: 'Variations de couleur', type: [ColorVariationDto] })
  colorVariations: ColorVariationDto[];

  @ApiProperty({ description: 'Validateur du produit', type: ValidatorDto, required: false })
  validator?: ValidatorDto;
}

export class DesignDto {
  @ApiProperty({ description: 'ID du design' })
  id: number;

  @ApiProperty({ description: 'Nom du design' })
  name: string;

  @ApiProperty({ description: 'URL de l\'image du design' })
  imageUrl: string;

  @ApiProperty({ description: 'Public ID Cloudinary' })
  cloudinaryPublicId: string;

  @ApiProperty({ description: 'Catégorie du design' })
  category: string;

  @ApiProperty({ description: 'Format du design' })
  format: string;

  @ApiProperty({ description: 'Le design est-il validé' })
  isValidated: boolean;

  @ApiProperty({ description: 'Date de validation', required: false })
  validatedAt?: Date;

  @ApiProperty({ description: 'Vendeur du design', type: VendorInfoDto })
  vendor: VendorInfoDto;

  @ApiProperty({ description: 'Validateur du design', type: ValidatorDto, required: false })
  validator?: ValidatorDto;
}

export class DesignPositionDto {
  @ApiProperty({ description: 'ID du produit vendeur' })
  vendorProductId: number;

  @ApiProperty({ description: 'ID du design' })
  designId: number;

  @ApiProperty({ description: 'Position du design (JSON)' })
  position: object;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Design associé', type: DesignDto })
  design: DesignDto;
}

export class DesignTransformDto {
  @ApiProperty({ description: 'ID de la transformation' })
  id: number;

  @ApiProperty({ description: 'URL du design' })
  designUrl: string;

  @ApiProperty({ description: 'Transformations appliquées (JSON)' })
  transforms: object;

  @ApiProperty({ description: 'Date de dernière modification' })
  lastModified: Date;

  @ApiProperty({ description: 'Vendeur ayant effectué la transformation', type: VendorInfoDto })
  vendor: VendorInfoDto;
}

export class VendorProductImageDto {
  @ApiProperty({ description: 'ID de l\'image' })
  id: number;

  @ApiProperty({ description: 'Nom de la couleur', required: false })
  colorName?: string;

  @ApiProperty({ description: 'Code couleur', required: false })
  colorCode?: string;

  @ApiProperty({ description: 'Type d\'image' })
  imageType: string;

  @ApiProperty({ description: 'URL Cloudinary' })
  cloudinaryUrl: string;

  @ApiProperty({ description: 'Public ID Cloudinary' })
  cloudinaryPublicId: string;

  @ApiProperty({ description: 'Largeur', required: false })
  width?: number;

  @ApiProperty({ description: 'Hauteur', required: false })
  height?: number;

  @ApiProperty({ description: 'Taille du fichier', required: false })
  fileSize?: number;

  @ApiProperty({ description: 'Format de l\'image', required: false })
  format?: string;
}

export class DesignProductLinkDto {
  @ApiProperty({ description: 'ID du lien' })
  id: number;

  @ApiProperty({ description: 'ID du design' })
  designId: number;

  @ApiProperty({ description: 'ID du produit vendeur' })
  vendorProductId: number;

  @ApiProperty({ description: 'Design lié', type: DesignDto })
  design: DesignDto;
}

export class DesignApplicationDto {
  @ApiProperty({ description: 'Le produit a-t-il un design' })
  hasDesign: boolean;

  @ApiProperty({ description: 'URL du design à appliquer', required: false })
  designUrl?: string;

  @ApiProperty({ description: 'Public ID Cloudinary du design', required: false })
  designCloudinaryPublicId?: string;

  @ApiProperty({ description: 'Positionnement du design', enum: ['CENTER', 'TOP_LEFT', 'TOP_RIGHT', 'BOTTOM_LEFT', 'BOTTOM_RIGHT'] })
  positioning: string;

  @ApiProperty({ description: 'Échelle du design (0.1 à 2.0)' })
  scale: number;

  @ApiProperty({ description: 'Mode d\'application du design', enum: ['PRESERVED', 'ADAPTED'] })
  mode: string;
}

export class SelectedColorDto {
  @ApiProperty({ description: 'ID de la couleur' })
  id: number;

  @ApiProperty({ description: 'Nom de la couleur' })
  name: string;

  @ApiProperty({ description: 'Code couleur (hex)' })
  colorCode: string;
}

export class AdminProductDto {
  @ApiProperty({ description: 'ID du produit admin' })
  id: number;

  @ApiProperty({ description: 'Nom du produit admin' })
  name: string;

  @ApiProperty({ description: 'Description du produit admin' })
  description: string;

  @ApiProperty({ description: 'Prix du produit admin' })
  price: number;

  @ApiProperty({ description: 'Stock du produit admin' })
  stock: number;

  @ApiProperty({ description: 'Statut du produit admin' })
  status: string;

  @ApiProperty({ description: 'Catégories du produit', type: [CategoryDto] })
  categories: CategoryDto[];

  @ApiProperty({ description: 'Tailles disponibles', type: [ProductSizeDto] })
  sizes: ProductSizeDto[];

  @ApiProperty({ description: 'Variations de couleur', type: [ColorVariationDto] })
  colorVariations: ColorVariationDto[];

  @ApiProperty({ description: 'Validateur du produit', type: ValidatorDto, required: false })
  validator?: ValidatorDto;
}

export class CompleteVendorProductDto {
  @ApiProperty({ description: 'ID du produit vendeur' })
  id: number;

  @ApiProperty({ description: 'Nom du produit' })
  name: string;

  @ApiProperty({ description: 'Description du produit' })
  description: string;

  @ApiProperty({ description: 'Prix du produit' })
  price: number;

  @ApiProperty({ description: 'Stock du produit' })
  stock: number;

  @ApiProperty({ description: 'Statut du produit' })
  status: string;

  @ApiProperty({ description: 'Action post-validation' })
  postValidationAction: string;

  // 🆕 NOUVELLES STRUCTURES CRITIQUES
  @ApiProperty({ description: 'Application du design (CRITIQUE pour UI)', type: DesignApplicationDto })
  designApplication: DesignApplicationDto;

  @ApiProperty({ description: 'Couleurs sélectionnées (CRITIQUE pour UI)', type: [SelectedColorDto] })
  selectedColors: SelectedColorDto[];

  @ApiProperty({ description: 'Positions enrichies des designs', type: [DesignPositionDto] })
  designPositions: DesignPositionDto[];

  @ApiProperty({ description: 'Produit admin avec variations complètes', type: AdminProductDto })
  adminProduct: AdminProductDto;

  // Informations admin originales (LEGACY)
  @ApiProperty({ description: 'Nom original du produit admin', required: false })
  adminProductName?: string;

  @ApiProperty({ description: 'Description originale du produit admin', required: false })
  adminProductDescription?: string;

  @ApiProperty({ description: 'Prix original du produit admin', required: false })
  adminProductPrice?: number;

  // Design principal (LEGACY - gardé pour compatibilité)
  @ApiProperty({ description: 'URL Cloudinary du design principal', required: false })
  designCloudinaryUrl?: string;

  @ApiProperty({ description: 'Public ID Cloudinary du design', required: false })
  designCloudinaryPublicId?: string;

  @ApiProperty({ description: 'Positionnement du design', required: false })
  designPositioning?: string;

  @ApiProperty({ description: 'Échelle du design', required: false })
  designScale?: number;

  @ApiProperty({ description: 'Mode d\'application du design', required: false })
  designApplicationMode?: string;

  @ApiProperty({ description: 'ID du design associé', required: false })
  designId?: number;

  // Sélections vendeur (LEGACY)
  @ApiProperty({ description: 'Tailles sélectionnées (JSON)' })
  sizes: object;

  @ApiProperty({ description: 'Couleurs sélectionnées (JSON)' })
  colors: object;

  // Métadonnées vendeur
  @ApiProperty({ description: 'Nom personnalisé du vendeur', required: false })
  vendorName?: string;

  @ApiProperty({ description: 'Description personnalisée du vendeur', required: false })
  vendorDescription?: string;

  @ApiProperty({ description: 'Stock du vendeur' })
  vendorStock: number;

  @ApiProperty({ description: 'Prix de base admin' })
  basePriceAdmin: number;

  // Validation
  @ApiProperty({ description: 'Le produit est-il validé' })
  isValidated: boolean;

  @ApiProperty({ description: 'Date de validation', required: false })
  validatedAt?: Date;

  @ApiProperty({ description: 'ID du validateur', required: false })
  validatedBy?: number;

  @ApiProperty({ description: 'Raison de rejet', required: false })
  rejectionReason?: string;

  @ApiProperty({ description: 'Date de soumission pour validation', required: false })
  submittedForValidationAt?: Date;

  // Timestamps
  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  // Relations enrichies (LEGACY - gardé pour compatibilité)
  @ApiProperty({ description: 'Informations du vendeur', type: VendorInfoDto })
  vendor: VendorInfoDto;

  @ApiProperty({ description: 'Produit de base (legacy)', type: BaseProductDto })
  baseProduct: BaseProductDto;

  @ApiProperty({ description: 'Validateur', type: ValidatorDto, required: false })
  validator?: ValidatorDto;

  @ApiProperty({ description: 'Design principal', type: DesignDto, required: false })
  design?: DesignDto;

  @ApiProperty({ description: 'Images du produit vendeur', type: [VendorProductImageDto] })
  images: VendorProductImageDto[];

  @ApiProperty({ description: 'Transformations des designs', type: [DesignTransformDto] })
  designTransforms: DesignTransformDto[];

  @ApiProperty({ description: 'Liens design-produit', type: [DesignProductLinkDto] })
  designProductLinks: DesignProductLinkDto[];

  // Métadonnées calculées
  @ApiProperty({ description: 'A-t-il un design' })
  hasDesign: boolean;

  @ApiProperty({ description: 'A-t-il des images' })
  hasImages: boolean;

  @ApiProperty({ description: 'A-t-il des positions' })
  hasPositions: boolean;

  @ApiProperty({ description: 'A-t-il des transformations' })
  hasTransforms: boolean;

  @ApiProperty({ description: 'Nombre total de liens design' })
  totalDesignLinks: number;

  // Statut enrichi
  @ApiProperty({ description: 'Affichage du statut' })
  statusDisplay: string;

  @ApiProperty({ description: 'Peut être publié' })
  canBePublished: boolean;

  @ApiProperty({ description: 'Nécessite une validation' })
  needsValidation: boolean;
}

export class PaginationDto {
  @ApiProperty({ description: 'Page actuelle' })
  currentPage: number;

  @ApiProperty({ description: 'Nombre total de pages' })
  totalPages: number;

  @ApiProperty({ description: 'Nombre total d\'éléments' })
  totalItems: number;

  @ApiProperty({ description: 'Éléments par page' })
  itemsPerPage: number;
}

export class VendorProductStatsDto {
  @ApiProperty({ description: 'Nombre total de produits' })
  totalProducts: number;

  @ApiProperty({ description: 'Produits en attente' })
  pendingProducts: number;

  @ApiProperty({ description: 'Produits publiés' })
  publishedProducts: number;

  @ApiProperty({ description: 'Produits en brouillon' })
  draftProducts: number;

  @ApiProperty({ description: 'Produits rejetés' })
  rejectedProducts: number;

  @ApiProperty({ description: 'Produits validés' })
  validatedProducts: number;

  @ApiProperty({ description: 'Nombre total de vendeurs' })
  totalVendors: number;

  @ApiProperty({ description: 'Nombre total de designs' })
  totalDesigns: number;

  @ApiProperty({ description: 'Nombre total d\'images' })
  totalImages: number;

  @ApiProperty({ description: 'Taux de validation (%)' })
  validationRate: string;
}

export class CompleteVendorProductsResponseDto {
  @ApiProperty({ description: 'Liste des produits vendeur', type: [CompleteVendorProductDto] })
  products: CompleteVendorProductDto[];

  @ApiProperty({ description: 'Informations de pagination', type: PaginationDto })
  pagination: PaginationDto;

  @ApiProperty({ description: 'Statistiques globales', type: VendorProductStatsDto })
  stats: VendorProductStatsDto;
} 