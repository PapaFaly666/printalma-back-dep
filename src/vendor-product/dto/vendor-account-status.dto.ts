import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateVendorAccountStatusDto {
  @ApiProperty({
    description: 'Statut du compte vendeur (true = actif, false = désactivé)',
    example: false,
    type: 'boolean'
  })
  @IsBoolean({ message: 'Le statut doit être un booléen' })
  status: boolean;

  @ApiProperty({
    description: 'Raison optionnelle de la désactivation',
    example: 'Pause temporaire pour les vacances',
    required: false,
    maxLength: 500
  })
  @IsOptional()
  @IsString({ message: 'La raison doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La raison ne peut pas dépasser 500 caractères' })
  reason?: string;
}

export class VendorAccountStatusResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: {
      id: 123,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      status: false,
      shop_name: 'Boutique John',
      statusChangedAt: '2024-01-15T10:30:00.000Z',
      reason: 'Pause temporaire pour les vacances'
    }
  })
  data: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: boolean;
    shop_name?: string;
    statusChangedAt: string;
    reason?: string;
  };

  @ApiProperty({ example: 'Compte désactivé avec succès' })
  message: string;
}

export class VendorAccountInfoDto {
  @ApiProperty({ example: 123 })
  id: number;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: true })
  status: boolean;

  @ApiProperty({ example: 'Boutique John', required: false })
  shop_name?: string;

  @ApiProperty({ example: '+33 6 12 34 56 78', required: false })
  phone?: string;

  @ApiProperty({ example: 'France', required: false })
  country?: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', required: false })
  last_login_at?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updated_at: string;

  @ApiProperty({
    example: {
      totalProducts: 12,
      publishedProducts: 8,
      totalDesigns: 15,
      publishedDesigns: 10
    }
  })
  statistics: {
    totalProducts: number;
    publishedProducts: number;
    totalDesigns: number;
    publishedDesigns: number;
  };
}

export class VendorAccountInfoResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: VendorAccountInfoDto })
  data: VendorAccountInfoDto;
}