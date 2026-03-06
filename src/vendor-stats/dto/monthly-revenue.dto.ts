import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MonthlyRevenueQueryDto {
  @ApiProperty({
    description: 'Nombre de mois à récupérer (entre 1 et 12)',
    example: 7,
    required: false,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  months?: number = 7;
}

export class MonthlyRevenueDataDto {
  @ApiProperty({
    description: 'Mois (format: Jan, Fév, Mar, etc.)',
    example: 'Jan',
  })
  month: string;

  @ApiProperty({
    description: 'Revenus totaux du mois en FCFA (produits + designs)',
    example: 45000,
  })
  revenue: number;

  @ApiProperty({
    description: 'Nombre de commandes du mois',
    example: 12,
  })
  orders: number;

  @ApiProperty({
    description: 'Revenus des produits uniquement en FCFA',
    example: 35000,
    required: false,
  })
  productRevenue?: number;

  @ApiProperty({
    description: 'Revenus des designs uniquement en FCFA',
    example: 10000,
    required: false,
  })
  designRevenue?: number;

  @ApiProperty({
    description: 'Nombre d\'utilisations de designs du mois',
    example: 5,
    required: false,
  })
  designUsages?: number;
}

export class AnnualRevenueStatsDto {
  @ApiProperty({
    description: 'Chiffre d\'affaires de l\'année en cours',
    example: 450000,
  })
  currentYearRevenue: number;

  @ApiProperty({
    description: 'Chiffre d\'affaires de l\'année précédente',
    example: 400000,
  })
  previousYearRevenue: number;

  @ApiProperty({
    description: 'Pourcentage d\'évolution par rapport à l\'année dernière',
    example: 12.5,
  })
  yearOverYearGrowth: number;

  @ApiProperty({
    description: 'Données mensuelles des 12 derniers mois',
    type: [Number],
  })
  monthlyData: number[];
}

export class MonthlyRevenueStatsDto {
  @ApiProperty({
    description: 'Chiffre d\'affaires du mois en cours',
    example: 45000,
  })
  currentMonthRevenue: number;

  @ApiProperty({
    description: 'Chiffre d\'affaires du mois précédent',
    example: 41500,
  })
  previousMonthRevenue: number;

  @ApiProperty({
    description: 'Pourcentage d\'évolution par rapport au mois dernier',
    example: 8.4,
  })
  monthOverMonthGrowth: number;

  @ApiProperty({
    description: 'Données des 7 derniers jours/semaines du mois',
    type: [Number],
  })
  weeklyData: number[];
}

export class MonthlyRevenueResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Statistiques mensuelles récupérées avec succès' })
  message: string;

  @ApiProperty({
    type: [MonthlyRevenueDataDto],
    description: 'Données mensuelles de revenus',
  })
  data: MonthlyRevenueDataDto[];
}

export class RevenueStatsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Statistiques de revenus récupérées avec succès' })
  message: string;

  @ApiProperty({
    type: 'object',
    description: 'Statistiques de revenus annuelles et mensuelles',
  })
  data: {
    annual: AnnualRevenueStatsDto;
    monthly: MonthlyRevenueStatsDto;
  };
}
