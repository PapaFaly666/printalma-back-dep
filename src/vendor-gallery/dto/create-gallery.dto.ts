import { IsString, IsOptional, MinLength, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GalleryImageDto {
  @ApiPropertyOptional({ description: 'Légende de l\'image', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La légende ne peut pas dépasser 200 caractères' })
  caption?: string;
}

export class CreateGalleryDto {
  @ApiProperty({
    description: 'Titre de la galerie',
    minLength: 3,
    maxLength: 100,
    example: 'Ma Collection Printemps 2024'
  })
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @MinLength(3, { message: 'Le titre doit contenir au moins 3 caractères' })
  @MaxLength(100, { message: 'Le titre ne peut pas dépasser 100 caractères' })
  title: string;

  @ApiPropertyOptional({
    description: 'Description de la galerie',
    maxLength: 500,
    example: 'Une collection inspirée par les couleurs du printemps'
  })
  @IsOptional()
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  @MaxLength(500, { message: 'La description ne peut pas dépasser 500 caractères' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Légendes pour chaque image (tableau JSON)',
    type: [GalleryImageDto],
    example: [
      { caption: 'Design floral' },
      { caption: 'Motif abstrait' }
    ]
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  })
  @ValidateNested({ each: true })
  @Type(() => GalleryImageDto)
  captions?: GalleryImageDto[];
}
