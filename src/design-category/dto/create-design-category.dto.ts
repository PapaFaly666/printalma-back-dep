import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsInt, IsHexColor, Length, Matches, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDesignCategoryDto {
  @ApiProperty({ 
    example: 'Logo Design',
    description: 'Nom de la catégorie de design'
  })
  @IsNotEmpty({ message: 'Le nom de la catégorie est requis' })
  @IsString()
  @Length(2, 50, { message: 'Le nom doit contenir entre 2 et 50 caractères' })
  name: string;

  @ApiProperty({ 
    example: 'Catégorie pour les designs de logos et identités visuelles',
    description: 'Description optionnelle de la catégorie',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(0, 200, { message: 'La description ne peut pas dépasser 200 caractères' })
  description?: string;

  @ApiProperty({ 
    example: 'logo-design',
    description: 'Slug pour URL (généré automatiquement si non fourni)',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets' })
  @Length(2, 50, { message: 'Le slug doit contenir entre 2 et 50 caractères' })
  slug?: string;

  @ApiProperty({ 
    type: 'string',
    format: 'binary',
    description: 'Image de couverture de la catégorie (optionnelle)',
    required: false
  })
  coverImage?: any;

  @ApiProperty({ 
    example: true,
    description: 'Catégorie active ou désactivée',
    required: false,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ 
    example: 10,
    description: 'Ordre d\'affichage (0 = premier)',
    required: false,
    default: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'L\'ordre d\'affichage doit être supérieur ou égal à 0' })
  @Max(9999, { message: 'L\'ordre d\'affichage ne peut pas dépasser 9999' })
  sortOrder?: number;
}

export class UpdateDesignCategoryDto {
  @ApiProperty({ 
    example: 'Logo Design Mis à Jour',
    description: 'Nouveau nom de la catégorie',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'Le nom doit contenir entre 2 et 50 caractères' })
  name?: string;

  @ApiProperty({ 
    example: 'Description mise à jour',
    description: 'Nouvelle description de la catégorie',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(0, 200, { message: 'La description ne peut pas dépasser 200 caractères' })
  description?: string;

  @ApiProperty({ 
    example: 'nouveau-slug',
    description: 'Nouveau slug pour URL',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets' })
  @Length(2, 50, { message: 'Le slug doit contenir entre 2 et 50 caractères' })
  slug?: string;

  @ApiProperty({ 
    type: 'string',
    format: 'binary',
    description: 'Nouvelle image de couverture (optionnelle)',
    required: false
  })
  coverImage?: any;

  @ApiProperty({ 
    example: false,
    description: 'Nouveau statut',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ 
    example: 5,
    description: 'Nouvel ordre d\'affichage',
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'L\'ordre d\'affichage doit être supérieur ou égal à 0' })
  @Max(9999, { message: 'L\'ordre d\'affichage ne peut pas dépasser 9999' })
  sortOrder?: number;
}

export class DesignCategoryResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Logo Design' })
  name: string;

  @ApiProperty({ example: 'Catégorie pour les designs de logos' })
  description: string;

  @ApiProperty({ example: 'logo-design' })
  slug: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/printalma/image/upload/v123/cover.jpg' })
  coverImageUrl: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 10 })
  sortOrder: number;

  @ApiProperty({ example: 5 })
  designCount: number;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiProperty({ 
    example: { 
      id: 1, 
      firstName: 'Admin', 
      lastName: 'User' 
    } 
  })
  creator: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export class ListDesignCategoriesQueryDto {
  @ApiProperty({ 
    example: true,
    description: 'Filtrer par statut actif',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ 
    example: 'logo',
    description: 'Recherche par nom ou slug',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(1, 50, { message: 'La recherche doit contenir entre 1 et 50 caractères' })
  search?: string;

  @ApiProperty({ 
    example: 1,
    description: 'Numéro de page',
    required: false,
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'Le numéro de page doit être supérieur à 0' })
  page?: number = 1;

  @ApiProperty({ 
    example: 20,
    description: 'Nombre d\'éléments par page',
    required: false,
    default: 20
  })
  @IsOptional()
  @IsInt()
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Max(100, { message: 'La limite ne peut pas dépasser 100' })
  limit?: number = 20;
}