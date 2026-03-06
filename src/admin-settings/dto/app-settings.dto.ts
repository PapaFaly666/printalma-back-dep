import { IsOptional, IsString, IsBoolean, IsNumber, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO pour les paramètres généraux de l'application
 */
export class AppSettingsDto {
  @ApiPropertyOptional({
    description: 'Nom de l\'application',
    example: 'PrintAlma'
  })
  @IsOptional()
  @IsString()
  appName?: string;

  @ApiPropertyOptional({
    description: 'Email de contact principal',
    example: 'contact@printalma.com'
  })
  @IsOptional()
  @IsEmail({}, { message: 'L\'email de contact doit être valide' })
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Email de support technique',
    example: 'support@printalma.com'
  })
  @IsOptional()
  @IsEmail({}, { message: 'L\'email de support doit être valide' })
  supportEmail?: string;

  @ApiPropertyOptional({
    description: 'Numéro de téléphone de contact',
    example: '+221 77 123 45 67'
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Adresse de l\'entreprise',
    example: 'Dakar, Sénégal'
  })
  @IsOptional()
  @IsString()
  companyAddress?: string;

  @ApiPropertyOptional({
    description: 'URL du site web',
    example: 'https://printalma.com'
  })
  @IsOptional()
  @IsString()
  websiteUrl?: string;

  @ApiPropertyOptional({
    description: 'Activer les inscriptions des vendeurs',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  vendorRegistrationEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Activer les notifications par email',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  emailNotificationsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Commission par défaut des vendeurs (%)',
    example: 40
  })
  @IsOptional()
  @IsNumber()
  defaultVendorCommission?: number;

  @ApiPropertyOptional({
    description: 'Montant minimum pour une demande de retrait',
    example: 10000
  })
  @IsOptional()
  @IsNumber()
  minWithdrawalAmount?: number;

  @ApiPropertyOptional({
    description: 'Devise de l\'application',
    example: 'XOF'
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Mode maintenance activé',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @ApiPropertyOptional({
    description: 'Message de maintenance',
    example: 'Le site est en maintenance. Nous revenons bientôt.'
  })
  @IsOptional()
  @IsString()
  maintenanceMessage?: string;
}

/**
 * DTO de réponse pour les paramètres de l'application
 */
export class AppSettingsResponseDto extends AppSettingsDto {
  @ApiProperty({ description: 'Date de dernière mise à jour', example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;

  @ApiProperty({ description: 'ID de l\'administrateur qui a fait la dernière modification', example: 1 })
  updatedBy?: number;
}

/**
 * DTO pour les statistiques générales de l'admin
 */
export class AdminStatsDto {
  @ApiProperty({ description: 'Nombre total de vendeurs', example: 150 })
  totalVendors: number;

  @ApiProperty({ description: 'Nombre de vendeurs actifs', example: 120 })
  activeVendors: number;

  @ApiProperty({ description: 'Nombre de vendeurs inactifs', example: 30 })
  inactiveVendors: number;

  @ApiProperty({ description: 'Nombre total de commandes', example: 5000 })
  totalOrders: number;

  @ApiProperty({ description: 'Nombre de commandes en cours', example: 50 })
  pendingOrders: number;

  @ApiProperty({ description: 'Chiffre d\'affaires total', example: 50000000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Nombre total de produits', example: 2000 })
  totalProducts: number;

  @ApiProperty({ description: 'Nombre de produits actifs', example: 1800 })
  activeProducts: number;
}
