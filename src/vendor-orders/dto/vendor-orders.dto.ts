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
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

/**
 * DTO pour les filtres de commandes vendeur
 */
export class VendorOrderFiltersDto {
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
  @IsEnum(OrderStatus)
  @Transform(({ value }) => value?.toUpperCase())
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

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

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'totalAmount', 'orderNumber'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * DTO pour la mise à jour du statut de commande
 */
export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  @Transform(({ value }) => value?.toUpperCase())
  status: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Interfaces pour les réponses API
 */
export interface VendorUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  photo_profil?: string;
}

export interface ShippingAddress {
  name: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  region: string;
  country: string;
  fullFormatted: string;
  phone: string;
}

export interface OrderItemProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  designName: string;
  designDescription: string;
  designImageUrl: string;
  categoryId: number;
  categoryName: string;
}

export interface VendorOrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  size?: string;
  color?: string;
  colorId?: number;
  vendorProductId?: number;
  designId?: number;
  designMetadata?: any;
  designPositions?: any;
  mockupUrl?: string;
  customizationId?: number;
  customizationIds?: any;
  delimitation?: any;
  designElementsByView?: any;
  viewsMetadata?: any[];
  totalPrice: number;
  delimitations?: any[];
  colorVariationData?: any;
  product?: any; // Utiliser any pour la structure complète
  colorVariation?: any;
  customization?: any;
  isCustomizedProduct?: boolean;
}

export interface VendorOrder {
  id: number;
  orderNumber: string;
  userId: number;
  user: any; // Utiliser any pour correspondre à la structure complète
  status: string;
  totalAmount: number;
  phoneNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  validatedBy?: number;
  validator?: any;
  shippingName?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingRegion?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
  shippingAddressFull?: string;
  confirmedAt?: string;
  deliveredAt?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  shippedAt?: string;
  shippingAmount?: number;
  subtotal?: number;
  taxAmount?: number;
  hasInsufficientFunds?: boolean;
  lastPaymentAttemptAt?: string;
  lastPaymentFailureReason?: string;
  paymentAttempts?: number;
  email?: string;
  deliveryType?: string;
  deliveryCityId?: string;
  deliveryCityName?: string;
  deliveryRegionId?: string;
  deliveryRegionName?: string;
  deliveryZoneId?: string;
  deliveryZoneName?: string;
  transporteurId?: string;
  transporteurName?: string;
  transporteurLogo?: string;
  transporteurPhone?: string;
  deliveryFee?: number;
  deliveryTime?: string;
  zoneTarifId?: string;
  deliveryMetadata?: any;
  commissionRate?: number;
  commissionAmount?: number;
  vendorAmount?: number;
  commissionAppliedAt?: string;
  beneficeCommande?: number;
  deliveryInfo?: any;
  payment_info?: any;
  customer_info?: any;
  paymentAttemptsHistory?: any[];
  orderItems: VendorOrderItem[];
}

export interface VendorOrdersListData {
  orders: VendorOrder[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface VendorStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenueThisMonth: number;
  ordersThisMonth: number;
  revenueLastMonth: number;
  ordersLastMonth: number;
}

export interface VendorNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId?: number;
  isRead: boolean;
  createdAt: string;
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

export type VendorOrderResponseDto = ApiResponse<VendorOrder>;
export type VendorOrdersListResponseDto = ApiResponse<VendorOrdersListData>;
export type VendorStatisticsResponseDto = ApiResponse<VendorStatistics>;
export type NotificationResponseDto = ApiResponse<VendorNotification[]>;

/**
 * Enum pour les types de notifications vendeur (selon la doc)
 */
export enum VendorNotificationType {
  NEW_ORDER = 'NEW_ORDER',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
}