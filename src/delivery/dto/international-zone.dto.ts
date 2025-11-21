import { IsString, IsNumber, IsArray, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInternationalZoneDto {
  @ApiProperty({ description: 'Nom de la zone', example: 'Afrique de l\'Ouest' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Pays de la zone', example: ['Mali', 'Mauritanie', 'Guinée'] })
  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;

  @ApiProperty({ description: 'Prix de livraison', example: 15000 })
  @IsNumber()
  price: number;

  @ApiProperty({ description: 'Délai minimum de livraison (jours)', example: 5 })
  @IsNumber()
  deliveryTimeMin: number;

  @ApiProperty({ description: 'Délai maximum de livraison (jours)', example: 10 })
  @IsNumber()
  deliveryTimeMax: number;
}

export class UpdateInternationalZoneDto {
  @ApiPropertyOptional({ description: 'Nom de la zone', example: 'Afrique de l\'Ouest' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Pays de la zone', example: ['Mali', 'Mauritanie', 'Guinée'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  countries?: string[];

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;

  @ApiPropertyOptional({ description: 'Prix de livraison', example: 15000 })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({ description: 'Délai minimum de livraison (jours)', example: 5 })
  @IsOptional()
  @IsNumber()
  deliveryTimeMin?: number;

  @ApiPropertyOptional({ description: 'Délai maximum de livraison (jours)', example: 10 })
  @IsOptional()
  @IsNumber()
  deliveryTimeMax?: number;
}
