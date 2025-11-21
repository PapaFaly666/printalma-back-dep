import { IsString, IsArray, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTransporteurDto {
  @ApiProperty({ description: 'Nom du transporteur', example: 'DHL' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'URL du logo', example: 'https://example.com/dhl-logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Zones de livraison', example: ['zone1', 'zone2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryZones?: string[];

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;
}

export class UpdateTransporteurDto {
  @ApiPropertyOptional({ description: 'Nom du transporteur', example: 'DHL' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'URL du logo', example: 'https://example.com/dhl-logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Zones de livraison', example: ['zone1', 'zone2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliveryZones?: string[];

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;
}
