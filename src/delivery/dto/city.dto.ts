import { IsString, IsNumber, IsBoolean, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCityDto {
  @ApiProperty({ description: 'Nom de la ville' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Catégorie de la ville', example: 'Centre' })
  @IsString()
  @IsIn(['Centre', 'Résidentiel', 'Populaire', 'Banlieue'])
  category: string;

  @ApiProperty({ description: 'Type de zone', example: 'dakar-ville' })
  @IsString()
  @IsIn(['dakar-ville', 'banlieue'])
  zoneType: string;

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;

  @ApiProperty({ description: 'Prix de livraison', example: 1500 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Livraison gratuite', example: false })
  @IsBoolean()
  isFree: boolean;

  @ApiPropertyOptional({ description: 'Délai minimum de livraison', example: 24 })
  @IsOptional()
  @IsNumber()
  deliveryTimeMin?: number;

  @ApiPropertyOptional({ description: 'Délai maximum de livraison', example: 48 })
  @IsOptional()
  @IsNumber()
  deliveryTimeMax?: number;

  @ApiPropertyOptional({ description: 'Unité de temps', example: 'heures' })
  @IsOptional()
  @IsString()
  @IsIn(['heures', 'jours'])
  deliveryTimeUnit?: string;
}

export class UpdateCityDto {
  @ApiPropertyOptional({ description: 'Nom de la ville' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Catégorie de la ville', example: 'Centre' })
  @IsOptional()
  @IsString()
  @IsIn(['Centre', 'Résidentiel', 'Populaire', 'Banlieue'])
  category?: string;

  @ApiPropertyOptional({ description: 'Type de zone', example: 'dakar-ville' })
  @IsOptional()
  @IsString()
  @IsIn(['dakar-ville', 'banlieue'])
  zoneType?: string;

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;

  @ApiPropertyOptional({ description: 'Prix de livraison', example: 1500 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Livraison gratuite', example: false })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({ description: 'Délai minimum de livraison', example: 24 })
  @IsOptional()
  @IsNumber()
  deliveryTimeMin?: number;

  @ApiPropertyOptional({ description: 'Délai maximum de livraison', example: 48 })
  @IsOptional()
  @IsNumber()
  deliveryTimeMax?: number;

  @ApiPropertyOptional({ description: 'Unité de temps', example: 'heures' })
  @IsOptional()
  @IsString()
  @IsIn(['heures', 'jours'])
  deliveryTimeUnit?: string;
}
