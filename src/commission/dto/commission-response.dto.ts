import { ApiProperty } from '@nestjs/swagger';

export class CommissionResponseDto {
  @ApiProperty({ description: 'ID du vendeur' })
  vendorId: number;

  @ApiProperty({ description: 'Taux de commission actuel', example: 40.0 })
  commissionRate: number;

  @ApiProperty({ description: 'Date de création/dernière mise à jour' })
  updatedAt: string;

  @ApiProperty({ description: 'ID de l\'admin qui a défini la commission' })
  updatedBy: number;
}

export class VendorCommissionListDto {
  @ApiProperty({ description: 'ID du vendeur' })
  vendorId: number;

  @ApiProperty({ description: 'Prénom du vendeur' })
  firstName: string;

  @ApiProperty({ description: 'Nom du vendeur' })
  lastName: string;

  @ApiProperty({ description: 'Email du vendeur' })
  email: string;

  @ApiProperty({ description: 'Type de vendeur' })
  vendeur_type: string;

  @ApiProperty({ description: 'Taux de commission', example: 40.0 })
  commissionRate: number;

  @ApiProperty({ description: 'Revenu mensuel estimé en FCFA' })
  estimatedMonthlyRevenue: number;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  lastUpdated: string | null;
}

export class CommissionStatsDto {
  @ApiProperty({ description: 'Commission moyenne' })
  averageCommission: number;

  @ApiProperty({ description: 'Commission minimale' })
  minCommission: number;

  @ApiProperty({ description: 'Commission maximale' })
  maxCommission: number;

  @ApiProperty({ description: 'Nombre total de vendeurs' })
  totalVendors: number;

  @ApiProperty({ description: 'Nombre de vendeurs avec commission 0%' })
  freeVendors: number;

  @ApiProperty({ description: 'Nombre de vendeurs avec commission > 50%' })
  highCommissionVendors: number;
}