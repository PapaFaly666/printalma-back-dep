import { IsEmail, IsString, MinLength, IsEnum, IsOptional, Matches } from 'class-validator';

export enum VendeurTypeEnum {
  DESIGNER = 'DESIGNER',
  ARTISTE = 'ARTISTE',
  INFLUENCEUR = 'INFLUENCEUR'
}

export class RegisterVendorDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(VendeurTypeEnum)
  vendeur_type: VendeurTypeEnum;

  // 🆕 Champs étendus du profil vendeur
  @IsOptional()
  @IsString()
  @Matches(/^[\+]?[0-9\s\-\(\)]{8,}$/, { message: 'Format de téléphone invalide' })
  phone?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  shop_name?: string;
} 