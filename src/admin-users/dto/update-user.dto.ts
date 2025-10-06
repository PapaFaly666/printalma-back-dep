import { IsEmail, IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nom complet de l\'utilisateur',
    example: 'Jane Doe',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Email de l\'utilisateur',
    example: 'jane.doe@example.com',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+33 6 11 22 33 44',
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'ID du rôle personnalisé',
    example: 4,
    required: false,
  })
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsInt()
  @IsOptional()
  roleId?: number;

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
  @Transform(({ value }) => value ? value.toUpperCase() : undefined)
  status?: string;
}
