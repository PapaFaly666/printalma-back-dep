import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateSubCategoryDto {
  @ApiProperty({ description: 'Nom de la sous-catégorie', example: 'T-Shirts' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description de la sous-catégorie',
    example: 'T-shirts pour homme et femme',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'ID de la catégorie parente', example: 1 })
  @IsInt()
  categoryId: number;

  @ApiProperty({
    description: 'Ordre d\'affichage',
    example: 0,
    required: false
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
