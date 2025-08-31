import { ApiProperty } from '@nestjs/swagger';
import { DesignCategory } from './create-design.dto';

// =============================
// 🆕 INFOS VENDEUR POUR VALIDATION
// =============================
export class VendorInfoDto {
  @ApiProperty({ example: 45 })
  id: number;

  @ApiProperty({ example: 'Marie' })
  firstName: string;

  @ApiProperty({ example: 'Dubois' })
  lastName: string;

  @ApiProperty({ example: 'marie.dubois@printalma.com' })
  email: string;

  @ApiProperty({ example: 'Studio Marie Design', nullable: true })
  shop_name?: string;

  @ApiProperty({ example: '+33 6 12 34 56 78', nullable: true })
  phone?: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/.../profile-photos/vendor_45.png', nullable: true })
  profile_photo_url?: string;

  @ApiProperty({ example: 'France', nullable: true })
  country?: string;

  @ApiProperty({ example: '45 Av. des Champs-Élysées, 75008 Paris', nullable: true })
  address?: string;
}

export class DesignResponseDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 'Logo moderne entreprise' })
  name: string;

  @ApiProperty({ example: 'Un logo épuré et moderne pour entreprises tech', nullable: true })
  description?: string;

  @ApiProperty({ example: 2500 })
  price: number;

  @ApiProperty({ enum: DesignCategory, example: DesignCategory.LOGO })
  category: DesignCategory;

  @ApiProperty({ example: 'https://res.cloudinary.com/example/image/upload/v1620123456/designs/design_123.jpg' })
  imageUrl: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/example/image/upload/v1620123456/designs/design_123_thumb.jpg', nullable: true })
  thumbnailUrl?: string;

  @ApiProperty({ example: 1024000, nullable: true })
  fileSize?: number;

  @ApiProperty({ 
    example: { width: 2000, height: 2000 },
    nullable: true,
    description: 'Dimensions de l\'image'
  })
  dimensions?: {
    width: number;
    height: number;
  };

  @ApiProperty({ example: false })
  isPublished: boolean;

  @ApiProperty({ example: false })
  isPending: boolean;

  @ApiProperty({ example: true })
  isDraft: boolean;

  @ApiProperty({ example: false, description: 'Design validé par un admin' })
  isValidated: boolean;

  @ApiProperty({ 
    enum: ['PENDING', 'VALIDATED', 'REJECTED'], 
    example: 'PENDING', 
    description: 'Statut de validation du design' 
  })
  validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';

  @ApiProperty({ example: '2024-01-15T14:30:00Z', nullable: true, description: 'Date de validation' })
  validatedAt?: string;

  @ApiProperty({ example: 'Jean Dupont', nullable: true, description: 'Nom du validateur' })
  validatorName?: string;

  @ApiProperty({ 
    example: 'La qualité de l\'image doit être améliorée', 
    nullable: true, 
    description: 'Raison du rejet si applicable' 
  })
  rejectionReason?: string;

  @ApiProperty({ example: '2024-01-15T12:00:00Z', nullable: true, description: 'Date de soumission pour validation' })
  submittedForValidationAt?: string;

  @ApiProperty({ example: ['moderne', 'entreprise', 'tech'] })
  tags: string[];

  @ApiProperty({ example: 15 })
  usageCount: number;

  @ApiProperty({ example: 37500 })
  earnings: number;

  @ApiProperty({ example: 245 })
  views: number;

  @ApiProperty({ example: 18 })
  likes: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: string;

  @ApiProperty({ example: '2024-01-15T14:30:00Z', nullable: true })
  publishedAt?: string;

  // 🆕 Infos vendeur pour les admins lors de la validation
  @ApiProperty({ type: VendorInfoDto, nullable: true })
  vendor?: VendorInfoDto;
}

export class CreateDesignResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Design créé avec succès' })
  message: string;

  @ApiProperty({ type: DesignResponseDto })
  data: DesignResponseDto;
}

export class DesignListResponseDto {
  @ApiProperty({ type: [DesignResponseDto] })
  designs: DesignResponseDto[];

  @ApiProperty({
    example: {
      currentPage: 1,
      totalPages: 5,
      totalItems: 89,
      itemsPerPage: 20
    }
  })
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };

  @ApiProperty({
    example: {
      total: 89,
      published: 45,
      pending: 12,
      draft: 32,
      totalEarnings: 125000,
      totalViews: 15430,
      totalLikes: 892
    }
  })
  stats: {
    total: number;
    published: number;
    pending: number;
    draft: number;
    totalEarnings: number;
    totalViews: number;
    totalLikes: number;
  };
}

export class GetDesignsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: DesignListResponseDto })
  data: DesignListResponseDto;
}

export class PublishDesignDto {
  @ApiProperty({ example: true })
  isPublished: boolean;
}

export class DeleteDesignResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Design supprimé avec succès' })
  message: string;
}

export class DesignErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Erreurs de validation' })
  message: string;

  @ApiProperty({
    example: {
      name: 'Le nom doit contenir au moins 3 caractères',
      price: 'Le prix minimum est de 100 FCFA',
      file: 'Le fichier doit être une image (JPG, PNG, SVG)'
    },
    nullable: true
  })
  errors?: Record<string, string>;
} 