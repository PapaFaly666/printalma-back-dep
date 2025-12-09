import { IsEmail, IsNotEmpty, IsString, IsOptional, MinLength, IsEnum, IsBoolean, IsNumber, Min, Max, IsInt, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VendeurType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateClientDto {
  @ApiProperty({ example: 'Jean' })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Dupont' })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'jean.dupont@gmail.com' })
  @IsEmail()
  @IsNotEmpty({ message: 'Email est requis' })
  email: string;

  @ApiProperty({ 
    example: 'DESIGNER',
    description: 'Type de vendeur : DESIGNER, INFLUENCEUR ou ARTISTE',
    enum: VendeurType,
    required: true
  })
  @IsNotEmpty()
  @IsEnum(VendeurType, { message: 'Le type de vendeur doit être DESIGNER, INFLUENCEUR ou ARTISTE' })
  vendeur_type: VendeurType;

  // 🆕 NOUVEAUX CHAMPS POUR PROFIL VENDEUR ÉTENDU
  @ApiProperty({ 
    example: '+33 6 12 34 56 78',
    description: 'Numéro de téléphone (optionnel)',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^[\+]?[0-9\s\-\(\)]{8,}$/, { message: 'Format de téléphone invalide' })
  phone?: string;

  @ApiProperty({ 
    example: 'France',
    description: 'Pays de résidence (optionnel)',
    required: false
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ 
    example: '123 Rue de la Paix, 75001 Paris',
    description: 'Adresse complète (optionnel)',
    required: false
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ 
    example: 'Boutique Design Jean',
    description: 'Nom de la boutique (obligatoire)',
    required: true
  })
  @IsNotEmpty({ message: 'Le nom de la boutique est requis' })
  @IsString()
  shop_name: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldPassword123' })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsNotEmpty()
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}

// Nouveau DTO pour le changement de mot de passe obligatoire
export class ForceChangePasswordDto {
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Le nouveau mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword: string;
}

// DTOs pour la réinitialisation de mot de passe
export class ForgotPasswordDto {
  @ApiProperty({ 
    example: 'jean.dupont@gmail.com',
    description: 'Adresse email du compte pour lequel réinitialiser le mot de passe'
  })
  @IsEmail({}, { message: 'Format d\'email invalide' })
  @IsNotEmpty({ message: 'Email est requis' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ 
    example: 'abc123def456',
    description: 'Token de réinitialisation reçu par email'
  })
  @IsNotEmpty({ message: 'Token de réinitialisation requis' })
  @IsString()
  token: string;

  @ApiProperty({ 
    example: 'newSecurePassword123',
    description: 'Nouveau mot de passe (minimum 8 caractères)'
  })
  @IsNotEmpty({ message: 'Nouveau mot de passe requis' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;

  @ApiProperty({ 
    example: 'newSecurePassword123',
    description: 'Confirmation du nouveau mot de passe'
  })
  @IsNotEmpty({ message: 'Confirmation du mot de passe requise' })
  @IsString()
  confirmPassword: string;
}

// 🆕 DTO pour réinitialisation de mot de passe par admin (fonctionnalité non implémentée)
export class AdminResetPasswordDto {
  @ApiProperty({ 
    example: 1,
    description: 'ID du vendeur dont le mot de passe doit être réinitialisé'
  })
  @IsNotEmpty({ message: 'ID du vendeur requis' })
  @IsInt()
  vendorId: number;

  @ApiProperty({ 
    example: 'newTempPassword123',
    description: 'Nouveau mot de passe temporaire à définir'
  })
  @IsNotEmpty({ message: 'Nouveau mot de passe requis' })
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;

  @ApiProperty({ 
    example: true,
    description: 'Forcer le changement de mot de passe à la prochaine connexion',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  mustChangePassword?: boolean;
}

export class VerifyResetTokenDto {
  @ApiProperty({ 
    example: 'abc123def456',
    description: 'Token de réinitialisation à vérifier'
  })
  @IsNotEmpty({ message: 'Token de réinitialisation requis' })
  @IsString()
  token: string;
}

export class ListClientsQueryDto {
  @ApiProperty({ required: false, default: 1, description: 'Numéro de la page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La page doit être un nombre entier' })
  @Min(1, { message: 'La page doit être supérieure à 0' })
  page?: number;

  @ApiProperty({ required: false, default: 10, description: 'Nombre d\'éléments par page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La limite doit être un nombre entier' })
  @Min(1, { message: 'La limite doit être supérieure à 0' })
  @Max(100, { message: 'La limite ne peut pas dépasser 100' })
  limit?: number;

  @ApiProperty({ required: false, description: 'Statut actif/inactif' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean({ message: 'Le statut doit être un booléen' })
  status?: boolean;

  @ApiProperty({ required: false, enum: VendeurType, description: 'Type de vendeur' })
  @IsOptional()
  @IsEnum(VendeurType, { message: 'Le type de vendeur doit être DESIGNER, INFLUENCEUR ou ARTISTE' })
  vendeur_type?: VendeurType;

  @ApiProperty({ required: false, description: 'Recherche par nom, email ou boutique' })
  @IsOptional()
  @IsString()
  search?: string; // Recherche par nom ou email
}

export class ClientResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  vendeur_type: VendeurType;
  status: boolean;
  must_change_password: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  login_attempts: number;
  locked_until: Date | null;
}

export class VendorResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: VendeurType;
  created_at: Date;
  last_login_at: Date | null;
}

export class ListVendorsResponseDto {
  vendors: VendorResponseDto[];
  total: number;
  message: string;
}

export class VendorStatsDto {
  type: VendeurType;
  count: number;
  label: string;
  icon: string;
}

export class VendorsStatsResponseDto {
  stats: VendorStatsDto[];
  total: number;
  message: string;
}

export class ListClientsResponseDto {
  clients: ClientResponseDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    status?: boolean;
    vendeur_type?: VendeurType;
    search?: string;
  };
}

// 🆕 DTO pour mise à jour du profil vendeur
export class UpdateVendorProfileDto {
  @ApiProperty({ 
    example: 'Jean',
    description: 'Prénom',
    required: false
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ 
    example: 'Dupont',
    description: 'Nom de famille',
    required: false
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ 
    example: 'jean.dupont@gmail.com',
    description: 'Adresse email',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format d\'email invalide' })
  email?: string;

  @ApiProperty({ 
    example: '+33 6 12 34 56 78',
    description: 'Numéro de téléphone',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^[\+]?[0-9\s\-\(\)]{8,}$/, { message: 'Format de téléphone invalide' })
  phone?: string;

  @ApiProperty({ 
    example: 'France',
    description: 'Pays de résidence',
    required: false
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ 
    example: '123 Rue de la Paix, 75001 Paris',
    description: 'Adresse complète',
    required: false
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'Boutique Design Jean',
    description: 'Nom de la boutique',
    required: false
  })
  @IsOptional()
  @IsString()
  shop_name?: string;

  // 🆕 Champs réseaux sociaux
  @ApiProperty({
    example: 'https://facebook.com/maboutique',
    description: 'URL du profil Facebook',
    required: false
  })
  @IsOptional()
  @IsString()
  facebook_url?: string;

  @ApiProperty({
    example: 'https://instagram.com/@maboutique',
    description: 'URL du profil Instagram',
    required: false
  })
  @IsOptional()
  @IsString()
  instagram_url?: string;

  @ApiProperty({
    example: 'https://twitter.com/maboutique',
    description: 'URL du profil Twitter/X',
    required: false
  })
  @IsOptional()
  @IsString()
  twitter_url?: string;

  @ApiProperty({
    example: 'https://tiktok.com/@maboutique',
    description: 'URL du profil TikTok',
    required: false
  })
  @IsOptional()
  @IsString()
  tiktok_url?: string;

  @ApiProperty({
    example: 'https://youtube.com/channel/maboutique',
    description: 'URL de la chaîne YouTube',
    required: false
  })
  @IsOptional()
  @IsString()
  youtube_url?: string;

  @ApiProperty({
    example: 'https://linkedin.com/in/maboutique',
    description: 'URL du profil LinkedIn',
    required: false
  })
  @IsOptional()
  @IsString()
  linkedin_url?: string;
}

// 🆕 DTO pour mise à jour des informations vendeur par l'admin
export class AdminUpdateVendorDto {
  @ApiProperty({ 
    example: 'Jean',
    description: 'Prénom',
    required: false
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ 
    example: 'Dupont',
    description: 'Nom de famille',
    required: false
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ 
    example: 'jean.dupont@gmail.com',
    description: 'Adresse email',
    required: false
  })
  @IsOptional()
  @IsEmail({}, { message: 'Format d\'email invalide' })
  email?: string;

  @ApiProperty({ 
    example: 'DESIGNER',
    description: 'Type de vendeur',
    enum: VendeurType,
    required: false
  })
  @IsOptional()
  @IsEnum(VendeurType, { message: 'Le type de vendeur doit être DESIGNER, INFLUENCEUR ou ARTISTE' })
  vendeur_type?: VendeurType;

  @ApiProperty({ 
    example: '+33 6 12 34 56 78',
    description: 'Numéro de téléphone',
    required: false
  })
  @IsOptional()
  @IsString()
  @Matches(/^[\+]?[0-9\s\-\(\)]{8,}$/, { message: 'Format de téléphone invalide' })
  phone?: string;

  @ApiProperty({ 
    example: 'France',
    description: 'Pays de résidence',
    required: false
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ 
    example: '123 Rue de la Paix, 75001 Paris',
    description: 'Adresse complète',
    required: false
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ 
    example: 'Boutique Design Jean',
    description: 'Nom de la boutique',
    required: false
  })
  @IsOptional()
  @IsString()
  shop_name?: string;

  @ApiProperty({ 
    example: true,
    description: 'Statut actif du vendeur',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

}

// 🆕 DTO de réponse pour le profil vendeur étendu
export class ExtendedVendorProfileResponseDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: VendeurType;
  phone?: string;
  country?: string;
  address?: string;
  shop_name?: string;
  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/v1710000000/profile-photos/vendor_1_123456789.png',
    description: 'URL sécurisée de la photo de profil stockée sur Cloudinary',
    required: false
  })
  profile_photo_url?: string;

  // 🆕 Champs réseaux sociaux
  @ApiProperty({
    example: 'https://facebook.com/maboutique',
    description: 'URL du profil Facebook',
    required: false
  })
  facebook_url?: string;

  @ApiProperty({
    example: 'https://instagram.com/@maboutique',
    description: 'URL du profil Instagram',
    required: false
  })
  instagram_url?: string;

  @ApiProperty({
    example: 'https://twitter.com/maboutique',
    description: 'URL du profil Twitter/X',
    required: false
  })
  twitter_url?: string;

  @ApiProperty({
    example: 'https://tiktok.com/@maboutique',
    description: 'URL du profil TikTok',
    required: false
  })
  tiktok_url?: string;

  @ApiProperty({
    example: 'https://youtube.com/channel/maboutique',
    description: 'URL de la chaîne YouTube',
    required: false
  })
  youtube_url?: string;

  @ApiProperty({
    example: 'https://linkedin.com/in/maboutique',
    description: 'URL du profil LinkedIn',
    required: false
  })
  linkedin_url?: string;

  status: boolean;
  must_change_password: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
} 