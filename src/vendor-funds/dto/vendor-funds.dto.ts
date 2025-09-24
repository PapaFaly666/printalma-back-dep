import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsNotEmpty,
  IsArray,
  IsPhoneNumber,
  MaxLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { PaymentMethodType, FundsRequestStatus } from '@prisma/client';

/**
 * DTO pour les filtres de demandes de fonds vendeur
 */
export class VendorFundsRequestFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(FundsRequestStatus)
  @Transform(({ value }) => value?.toUpperCase())
  status?: FundsRequestStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'amount', 'status'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * DTO pour créer une demande d'appel de fonds
 */
export class CreateFundsRequestDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1000) // Minimum 1000 FCFA
  amount: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  description: string;

  @IsNotEmpty()
  @IsEnum(PaymentMethodType)
  paymentMethod: PaymentMethodType;

  // Téléphone requis sauf pour virement bancaire
  @ValidateIf((o) => o.paymentMethod !== 'BANK_TRANSFER')
  @IsNotEmpty()
  @IsString()
  @IsPhoneNumber('SN') // Numéro sénégalais
  phoneNumber?: string;

  // IBAN requis uniquement pour virement bancaire
  @ValidateIf((o) => o.paymentMethod === 'BANK_TRANSFER')
  @IsNotEmpty()
  @IsString()
  @Matches(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/i, {
    message: 'IBAN invalide'
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').toUpperCase() : value))
  iban?: string;

  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  orderIds?: number[];
}

/**
 * DTO pour traiter une demande (admin)
 */
export class ProcessFundsRequestDto {
  @IsNotEmpty()
  @IsEnum(FundsRequestStatus)
  @IsIn(['APPROVED', 'REJECTED', 'PAID'])
  status: FundsRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectReason?: string;
}

/**
 * DTO pour le traitement en lot (admin)
 */
export class BatchProcessFundsRequestDto {
  @IsNotEmpty()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  requestIds: number[];

  @IsNotEmpty()
  @IsEnum(FundsRequestStatus)
  @IsIn(['APPROVED', 'REJECTED', 'PAID'])
  status: FundsRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  adminNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  rejectReason?: string;
}

/**
 * DTO pour les filtres admin
 */
export class AdminFundsRequestFiltersDto extends VendorFundsRequestFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  vendorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;
}

/**
 * Interfaces pour les réponses API
 */
export interface VendorUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  shopName?: string;
}

export interface FundsRequestData {
  id: number;
  vendorId: number;
  vendor?: VendorUser;
  amount: number;
  requestedAmount: number;
  description: string;
  paymentMethod: string;
  phoneNumber: string;
  status: string;
  rejectReason?: string;
  adminNote?: string;
  processedBy?: number;
  processedByUser?: {
    id: number;
    firstName: string;
    lastName: string;
  };
  processedAt?: string;
  // 🔧 Nouvelles dates pour l'affichage
  requestedAt?: string; // Date de demande par le vendeur
  validatedAt?: string; // Date de validation par l'admin
  availableBalance: number;
  commissionRate: number;
  requestDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorEarningsData {
  totalEarnings: number;
  pendingAmount: number;
  availableAmount: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  commissionPaid: number;
  totalCommission: number;
  averageCommissionRate: number;
}

export interface VendorFundsRequestsListData {
  requests: FundsRequestData[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AdminFundsStatistics {
  totalPendingRequests: number;
  totalPendingAmount: number;
  totalProcessedToday: number;
  totalProcessedAmount: number;
  averageProcessingTime: number;
  requestsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
    paid: number;
  };
  requestsByPaymentMethod: {
    wave: number;
    orangeMoney: number;
    bankTransfer: number;
  };
}

/**
 * DTOs de réponse API standardisées
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

export type VendorEarningsResponseDto = ApiResponse<VendorEarningsData>;
export type VendorFundsRequestResponseDto = ApiResponse<FundsRequestData>;
export type VendorFundsRequestsListResponseDto = ApiResponse<VendorFundsRequestsListData>;
export type AdminFundsStatisticsResponseDto = ApiResponse<AdminFundsStatistics>;