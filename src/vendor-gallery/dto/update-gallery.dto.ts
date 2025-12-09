import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { GalleryStatus } from '@prisma/client';

export class UpdateGalleryDto {
  @ApiPropertyOptional({
    description: 'Titre de la galerie',
    minLength: 3,
    maxLength: 100
  })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caractères' })
  @MaxLength(100, { message: 'Le titre ne peut pas dépasser 100 caractères' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Description de la galerie',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Statut de la galerie',
    enum: GalleryStatus,
    example: GalleryStatus.PUBLISHED
  })
  @IsOptional()
  @IsEnum(GalleryStatus, { message: 'Statut invalide' })
  status?: GalleryStatus;

  @ApiPropertyOptional({
    description: 'La galerie est-elle publiée ?',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  is_published?: boolean;
}
