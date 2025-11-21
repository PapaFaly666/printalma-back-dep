import { IsString, IsNumber, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneTarifDto {
  @ApiProperty({ description: 'ID de la zone', example: 'iz1' })
  @IsString()
  zoneId: string;

  @ApiProperty({ description: 'Nom de la zone', example: 'Afrique de l\'Ouest' })
  @IsString()
  zoneName: string;

  @ApiProperty({ description: 'ID du transporteur', example: 't1' })
  @IsString()
  transporteurId: string;

  @ApiProperty({ description: 'Nom du transporteur', example: 'DHL' })
  @IsString()
  transporteurName: string;

  @ApiProperty({ description: 'Prix du transporteur', example: 25000 })
  @IsNumber()
  prixTransporteur: number;

  @ApiProperty({ description: 'Prix standard international', example: 15000 })
  @IsNumber()
  prixStandardInternational: number;

  @ApiProperty({ description: 'Délai minimum de livraison (jours)', example: 5 })
  @IsNumber()
  delaiLivraisonMin: number;

  @ApiProperty({ description: 'Délai maximum de livraison (jours)', example: 10 })
  @IsNumber()
  delaiLivraisonMax: number;

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;
}

export class UpdateZoneTarifDto {
  @ApiPropertyOptional({ description: 'ID de la zone', example: 'iz1' })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiPropertyOptional({ description: 'Nom de la zone', example: 'Afrique de l\'Ouest' })
  @IsOptional()
  @IsString()
  zoneName?: string;

  @ApiPropertyOptional({ description: 'ID du transporteur', example: 't1' })
  @IsOptional()
  @IsString()
  transporteurId?: string;

  @ApiPropertyOptional({ description: 'Nom du transporteur', example: 'DHL' })
  @IsOptional()
  @IsString()
  transporteurName?: string;

  @ApiPropertyOptional({ description: 'Prix du transporteur', example: 25000 })
  @IsOptional()
  @IsNumber()
  prixTransporteur?: number;

  @ApiPropertyOptional({ description: 'Prix standard international', example: 15000 })
  @IsOptional()
  @IsNumber()
  prixStandardInternational?: number;

  @ApiPropertyOptional({ description: 'Délai minimum de livraison (jours)', example: 5 })
  @IsOptional()
  @IsNumber()
  delaiLivraisonMin?: number;

  @ApiPropertyOptional({ description: 'Délai maximum de livraison (jours)', example: 10 })
  @IsOptional()
  @IsNumber()
  delaiLivraisonMax?: number;

  @ApiPropertyOptional({ description: 'Statut', example: 'active' })
  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: string;
}
