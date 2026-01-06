import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// DTO pour un numéro de téléphone
export class PhoneNumberDto {
  @ApiProperty({
    description: 'Numéro de téléphone au format sénégalais',
    example: '+221771234567',
  })
  @IsString()
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  number: string;

  @ApiProperty({
    description: 'Indique si ce numéro est le numéro principal',
    example: true,
  })
  @IsBoolean()
  isPrimary: boolean;
}

// DTO pour un réseau social
export class SocialMediaDto {
  @ApiProperty({
    description: 'Plateforme de réseau social',
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'],
    example: 'facebook',
  })
  @IsString()
  @IsIn(['facebook', 'instagram', 'twitter', 'linkedin', 'youtube'], {
    message:
      'La plateforme doit être facebook, instagram, twitter, linkedin ou youtube',
  })
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube';

  @ApiProperty({
    description: 'URL du profil sur le réseau social',
    example: 'https://facebook.com/myshop',
  })
  @IsUrl({}, { message: 'URL invalide' })
  url: string;
}

// DTO principal pour compléter l'onboarding
export class CompleteOnboardingDto {
  @ApiPropertyOptional({
    description: 'Liste des numéros de téléphone (optionnel, maximum 3)',
    type: [PhoneNumberDto],
    example: [
      { number: '+221771234567', isPrimary: true },
      { number: '+221772345678', isPrimary: false },
    ],
  })
  @IsOptional()
  @IsArray({ message: 'Les numéros de téléphone doivent être un tableau' })
  @ArrayMaxSize(3, {
    message: 'Vous ne pouvez pas fournir plus de 3 numéros de téléphone',
  })
  @ValidateNested({ each: true })
  @Type(() => PhoneNumberDto)
  phones?: PhoneNumberDto[];

  @ApiPropertyOptional({
    description: 'Liste des réseaux sociaux (optionnel)',
    type: [SocialMediaDto],
    example: [
      { platform: 'facebook', url: 'https://facebook.com/myshop' },
      { platform: 'instagram', url: 'https://instagram.com/myshop' },
    ],
  })
  @IsOptional()
  @IsArray({ message: 'Les réseaux sociaux doivent être un tableau' })
  @ValidateNested({ each: true })
  @Type(() => SocialMediaDto)
  socialMedia?: SocialMediaDto[];
}

// DTO pour mettre à jour les numéros de téléphone
export class UpdatePhonesDto {
  @ApiProperty({
    description: 'Liste des numéros de téléphone (minimum 1, maximum 3)',
    type: [PhoneNumberDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => PhoneNumberDto)
  phones: PhoneNumberDto[];
}
