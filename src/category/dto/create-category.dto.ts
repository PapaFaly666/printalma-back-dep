import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Nom de la catégorie', example: 'T-Shirt' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description de la catégorie', example: 'T-shirts personnalisables pour homme et femme', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}