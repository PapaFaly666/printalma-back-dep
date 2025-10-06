import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nom de la catégorie', example: 'T-Shirt' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description de la catégorie', example: 'T-shirts personnalisables pour homme et femme', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'ID de la catégorie parent', example: 1, required: false })
  @IsInt()
  @IsOptional()
  parentId?: number;

  @ApiProperty({ description: 'Niveau hiérarchique (0: parent, 1: sous-catégorie, 2: variation)', example: 0, required: false })
  @IsInt()
  @Min(0)
  @Max(2)
  @IsOptional()
  level?: number;

  @ApiProperty({ description: 'Ordre d\'affichage', example: 0, required: false })
  @IsInt()
  @IsOptional()
  order?: number;
}