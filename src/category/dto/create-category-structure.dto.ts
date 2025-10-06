import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsArray, ArrayMinSize } from 'class-validator';

export class CreateCategoryStructureDto {
  @ApiProperty({ description: 'Nom de la catégorie parent', example: 'Téléphone' })
  @IsString()
  parentName: string;

  @ApiProperty({ description: 'Description de la catégorie parent', example: 'Accessoires téléphone', required: false })
  @IsString()
  @IsOptional()
  parentDescription?: string;

  @ApiProperty({ description: 'Nom de la sous-catégorie', example: 'Coque', required: false })
  @IsString()
  @IsOptional()
  childName?: string;

  @ApiProperty({ description: 'Liste des variations', example: ['iPhone 13', 'iPhone 14', 'iPhone 15'] })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  variations: string[];
}
