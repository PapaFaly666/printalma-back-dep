import { IsNotEmpty, IsString, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO pour l'envoi d'un code OTP
 */
export class SendOTPDto {
  @ApiProperty({
    description: 'Numéro de téléphone au format sénégalais (ex: 77 123 45 67 ou +221771234567)',
    example: '77 123 45 67'
  })
  @IsNotEmpty({ message: 'Le numéro de téléphone est requis' })
  @IsString()
  phoneNumber: string;
}

/**
 * DTO pour la vérification d'un code OTP
 */
export class VerifyOTPDto {
  @ApiProperty({
    description: 'ID du code OTP généré',
    example: '123'
  })
  @IsNotEmpty({ message: 'L\'ID OTP est requis' })
  @IsString()
  otpId: string;

  @ApiProperty({
    description: 'Code OTP à 6 chiffres',
    example: '123456'
  })
  @IsNotEmpty({ message: 'Le code OTP est requis' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir exactement 6 chiffres' })
  code: string;
}

/**
 * DTO pour la suppression d'un numéro (nécessite OTP)
 */
export class DeletePhoneDto {
  @ApiProperty({
    description: 'Code OTP de confirmation',
    example: '123456'
  })
  @IsNotEmpty({ message: 'Le code OTP de confirmation est requis' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir exactement 6 chiffres' })
  otpCode: string;
}

/**
 * Response DTO pour l'envoi d'OTP
 */
export interface SendOTPResponseDto {
  success: boolean;
  otpId: string;
  expiresAt: number;
  message: string;
}

/**
 * Response DTO pour la vérification d'OTP
 */
export interface VerifyOTPResponseDto {
  success: boolean;
  phoneNumber: PhoneNumberDto;
  message: string;
}

/**
 * DTO pour les informations d'un numéro de téléphone
 */
export interface PhoneNumberDto {
  id: number;
  number: string;
  countryCode: string;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt: string | null;
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  securityHoldUntil: string | null;
  addedAt: string;
  canBeUsedForWithdrawal: boolean;
}

/**
 * Response DTO pour la liste des numéros
 */
export interface ListPhoneNumbersResponseDto {
  success: boolean;
  phoneNumbers: PhoneNumberDto[];
}
