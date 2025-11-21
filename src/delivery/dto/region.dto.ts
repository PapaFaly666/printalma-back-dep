import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRegionDto {
  @ApiProperty({ description: 'Nom de la région', example: 'Diourbel' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;

  @ApiProperty({ description: 'Prix de livraison', example: 3000 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Délai minimum de livraison (jours)', example: 2 })
  @IsNumber()
  deliveryTimeMin: number;

  @ApiProperty({ description: 'Délai maximum de livraison (jours)', example: 4 })
  @IsNumber()
  deliveryTimeMax: number;

  @ApiPropertyOptional({ description: 'Unité de temps', example: 'jours' })
  @IsOptional()
  @IsString()
  deliveryTimeUnit?: string;

  @ApiPropertyOptional({ description: 'Principales villes', example: 'Diourbel, Bambey, Mbacké' })
  @IsOptional()
  @IsString()
  mainCities?: string;
}

export class UpdateRegionDto {
  @ApiPropertyOptional({ description: 'Nom de la région', example: 'Diourbel' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;

  @ApiPropertyOptional({ description: 'Prix de livraison', example: 3000 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Délai minimum de livraison (jours)', example: 2 })
  @IsOptional()
  @IsNumber()
  deliveryTimeMin?: number;

  @ApiPropertyOptional({ description: 'Délai maximum de livraison (jours)', example: 4 })
  @IsOptional()
  @IsNumber()
  deliveryTimeMax?: number;

  @ApiPropertyOptional({ description: 'Unité de temps', example: 'jours' })
  @IsOptional()
  @IsString()
  deliveryTimeUnit?: string;

  @ApiPropertyOptional({ description: 'Principales villes', example: 'Diourbel, Bambey, Mbacké' })
  @IsOptional()
  @IsString()
  mainCities?: string;
}
