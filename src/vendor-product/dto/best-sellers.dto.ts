import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetBestSellersDto {
  @ApiProperty({
    description: 'Période de temps pour le classement',
    example: 'day',
    required: false,
    enum: ['day', 'week', 'month', 'all']
  })
  @IsOptional()
  @IsString()
  period?: 'day' | 'week' | 'month' | 'all';

  @ApiProperty({
    description: 'Limite de résultats (défaut: 20, maximum: 100)',
    example: 20,
    required: false,
    minimum: 1,
    maximum: 100,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({
    description: 'Filtrer par ID de vendeur',
    required: false,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  vendorId?: number;

  @ApiProperty({
    description: 'Filtrer par ID de catégorie',
    required: false,
    type: Number
  })
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @ApiProperty({
    description: 'Nombre minimum de ventes pour être classé meilleur vendeur',
    required: false,
    type: Number,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minSales?: number;

  @ApiProperty({
    description: 'Filtrer par genre',
    required: false,
    enum: ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'],
    type: String
  })
  @IsOptional()
  @IsString()
  gender?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';

  @ApiProperty({
    description: 'Filtre par prix maximum',
    required: false,
    type: Number,
    minimum: 0,
    maximum: 100000,
    default: 10000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  maxPrice?: number;
}

export interface BestSellerProduct {
  id: number;
  name: string;
  description?: string;
  price: number;
  totalQuantitySold: number;
  totalRevenue: number;
  averageUnitPrice: number;
  uniqueCustomers: number;
  firstSaleDate: Date;
  lastSaleDate: Date;
  rank: number;
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    shopName: string;
    profilePhotoUrl: string;
    email: string;
    phone: string;
    address?: string;
    country: string;
    vendorType: string;
    status: string;
    createdAt: Date;
    lastLoginAt: Date;
    shopDescription?: string;
    specialties: string[];
    responseTime: string;
    rating: number;
    totalSales: number;
    totalRevenue: number;
  };
}

export interface BestSellersResponse {
  success: boolean;
  message: string;
  data: {
    bestSellers: BestSellerProduct[];
    pagination: {
      total: number;
      limit: number;
      totalPages: number;
      page: number;
      offset: number;
      hasMore: boolean;
    };
  };
}