import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour la mise à jour du profil vendeur (titre et bio)
 */
export class UpdateVendorBioProfileDto {
  @ApiProperty({
    example: 'Graphiste Designer & Illustrateur',
    description: 'Titre professionnel du vendeur',
    required: false,
    maxLength: 200
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Le titre professionnel doit contenir au moins 2 caractères' })
  @MaxLength(200, { message: 'Le titre professionnel ne peut pas dépasser 200 caractères' })
  professional_title?: string;

  @ApiProperty({
    example: 'Passionné par le design depuis plus de 10 ans, je crée des illustrations uniques qui reflètent votre personnalité. Spécialisé dans le street art et les designs urbains.',
    description: 'Biographie du vendeur pour présenter son activité et son style',
    required: false,
    maxLength: 2000
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'La biographie doit contenir au moins 10 caractères' })
  @MaxLength(2000, { message: 'La biographie ne peut pas dépasser 2000 caractères' })
  vendor_bio?: string;
}

/**
 * DTO de réponse pour le profil vendeur
 */
export class VendorProfileResponseDto {
  @ApiProperty({
    example: 'Graphiste Designer & Illustrateur',
    description: 'Titre professionnel du vendeur'
  })
  professional_title?: string;

  @ApiProperty({
    example: 'Passionné par le design depuis plus de 10 ans, je crée des illustrations uniques qui reflètent votre personnalité.',
    description: 'Biographie du vendeur'
  })
  vendor_bio?: string;
}