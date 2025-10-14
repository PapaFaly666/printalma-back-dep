import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateVariationDto {
  @ApiProperty({ description: 'Nom de la variation', example: 'Col V' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description de la variation',
    example: 'T-shirt avec col en V',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'ID de la sous-catégorie parente', example: 5 })
  @IsInt()
  subCategoryId: number;

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
