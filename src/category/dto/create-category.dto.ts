import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsUrl } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nom de la catégorie', example: 'Vêtements' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description de la catégorie',
    example: 'Tous les vêtements personnalisables',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Ordre d\'affichage',
    example: 0,
    required: false
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'URL de l\'image de couverture',
    example: 'https://res.cloudinary.com/...',
    required: false
  })
  @IsUrl()
  @IsOptional()
  coverImageUrl?: string;

  @ApiProperty({
    description: 'Public ID Cloudinary de l\'image de couverture',
    example: 'categories/vetements_abc123',
    required: false
  })
  @IsString()
  @IsOptional()
  coverImagePublicId?: string;
}