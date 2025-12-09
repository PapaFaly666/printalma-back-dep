import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryStatus } from '@prisma/client';

export class GalleryImageResponseDto {
  @ApiProperty({ description: 'ID de l\'image' })
  id: number;

  @ApiProperty({ description: 'URL de l\'image' })
  imageUrl: string;

  @ApiProperty({ description: 'Public ID Cloudinary' })
  publicId: string;

  @ApiPropertyOptional({ description: 'Légende de l\'image' })
  caption?: string;

  @ApiProperty({ description: 'Position dans la galerie (1-5)' })
  orderPosition: number;

  @ApiProperty({ description: 'Taille du fichier en octets' })
  fileSize: number;

  @ApiProperty({ description: 'Type MIME' })
  mimeType: string;

  @ApiPropertyOptional({ description: 'Largeur de l\'image' })
  width?: number;

  @ApiPropertyOptional({ description: 'Hauteur de l\'image' })
  height?: number;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;
}

export class GalleryResponseDto {
  @ApiProperty({ description: 'ID de la galerie' })
  id: number;

  @ApiProperty({ description: 'ID du vendeur' })
  vendorId: number;

  @ApiProperty({ description: 'Titre de la galerie' })
  title: string;

  @ApiPropertyOptional({ description: 'Description de la galerie' })
  description?: string;

  @ApiProperty({ enum: GalleryStatus, description: 'Statut de la galerie' })
  status: GalleryStatus;

  @ApiProperty({ description: 'La galerie est-elle publiée ?' })
  isPublished: boolean;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Date de suppression' })
  deletedAt?: Date;

  @ApiProperty({ type: [GalleryImageResponseDto], description: 'Images de la galerie' })
  images: GalleryImageResponseDto[];

  @ApiPropertyOptional({ description: 'Nombre d\'images' })
  images_count?: number;
}

export class PaginatedGalleryResponseDto {
  @ApiProperty({ type: [GalleryResponseDto] })
  galleries: GalleryResponseDto[];

  @ApiProperty({ description: 'Informations de pagination' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
