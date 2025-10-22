import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryVariationDto {
  @ApiProperty({
    description: 'Recherche par nom (recherche partielle, insensible à la casse)',
    example: 'col v',
    required: false
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({
    description: 'Filtrer par sous-catégorie parente',
    example: 5,
    required: false
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @IsOptional()
  subCategoryId?: number;

  @ApiProperty({
    description: 'Filtrer par statut actif/inactif',
    example: true,
    required: false
  })
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Nombre d\'éléments à retourner',
    example: 10,
    required: false,
    minimum: 1,
    maximum: 100
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: 'Nombre d\'éléments à sauter (pour la pagination)',
    example: 0,
    required: false,
    minimum: 0
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}
