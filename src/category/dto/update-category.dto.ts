import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({ description: 'Nom de la catégorie', example: 'T-Shirt', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Description de la catégorie', example: 'T-shirts personnalisables pour homme et femme', required: false })
  @IsString()
  @IsOptional()
  description?: string;
} 