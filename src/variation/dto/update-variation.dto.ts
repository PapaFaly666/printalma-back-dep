import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, MinLength, MaxLength, IsBoolean } from 'class-validator';

export class UpdateVariationDto {
  @ApiProperty({
    description: 'Nom de la variation',
    example: 'Col V Premium',
    required: false,
    minLength: 2,
    maxLength: 100
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @MinLength(2, { message: 'Le nom doit contenir au moins 2 caractères' })
  @MaxLength(100, { message: 'Le nom ne peut pas dépasser 100 caractères' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description de la variation',
    example: 'T-shirt avec col en V en coton premium',
    required: false,
    maxLength: 500
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Ordre d\'affichage',
    example: 0,
    required: false
  })
  @IsInt({ message: 'L\'ordre d\'affichage doit être un nombre entier' })
  @Min(0, { message: 'L\'ordre d\'affichage doit être supérieur ou égal à 0' })
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'Statut actif/inactif',
    example: true,
    required: false
  })
  @IsBoolean({ message: 'Le statut doit être un booléen' })
  @IsOptional()
  isActive?: boolean;
}
