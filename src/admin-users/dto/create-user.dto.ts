import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MinLength, IsIn, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum UserStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class CreateUserDto {
  @ApiProperty({
    description: 'Nom complet de l\'utilisateur',
    example: 'Jane Smith',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Email de l\'utilisateur',
    example: 'jane@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Mot de passe (minimum 8 caractères). Si non fourni, un mot de passe aléatoire sera généré.',
    example: 'SecurePass123!',
    required: false,
  })
  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @ApiProperty({
    description: 'Générer automatiquement un mot de passe aléatoire',
    example: false,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  generatePassword?: boolean;

  @ApiProperty({
    description: 'Envoyer les identifiants par email à l\'utilisateur',
    example: true,
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  sendCredentialsByEmail?: boolean;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+33 6 98 76 54 32',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'ID du rôle personnalisé',
    example: 3,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @IsNotEmpty()
  roleId: number;

  @ApiProperty({
    description: 'Statut de l\'utilisateur',
    enum: ['active', 'inactive', 'suspended'],
    example: 'active',
    required: false,
  })
  @IsOptional()
  @IsIn(['active', 'inactive', 'suspended', 'ACTIVE', 'INACTIVE', 'SUSPENDED'], {
    message: 'status must be one of: active, inactive, suspended',
  })
  @Transform(({ value }) => {
    if (!value) return 'ACTIVE';
    return value.toUpperCase();
  })
  status?: string;
}
